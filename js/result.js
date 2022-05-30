//Obtener id a partir del parametro
const urlSearchParams = new URLSearchParams(window.location.search);
const params = Object.fromEntries(urlSearchParams.entries());
const tornado_id = params['id']
//Conexion a wikidata
const wdk = WBK({
    instance: 'https://www.wikidata.org',
    sparqlEndpoint: 'https://query.wikidata.org/sparql'
})
//Diccionario para convertir URI en texto legible
const uri_2_text = {
    "https://schema.org/startDate": "Start of event",
    "https://schema.org/latitude": "Latitude",
    "https://schema.org/longitude": "Longitude",
    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type": "Type of event",
    "http://sweetontology.net/phenAtmoPrecipitation/Tornado":"Tornado",
    "http://www.wikidata.org/entity/Q37602": "Hail",
    "http://www.wikidata.org/entity/Q860333": "Flash Flood",
    "http://www.wikidata.org/entity/Q8068": "Flood",
    "https://schema.org/distance": "Distance traveled by tornado (miles)",
    "https://schema.org/width": "Width of tornado (yards)",
    "https://schema.org/location": "Location",
    "http://purl.org/dc/elements/1.1/source": "Source of data",
    "http://sweetontology.net/stateStorm/EnhancedFujitaScale": "Enhanced Fujita Scale",
    "http://sweetontology.net/stateStorm/FujitaPearsonScale": "Fujita Scale",
    "http://www.example.org/rdf#costOfDamage": "Cost of damage ($)",
    "http://www.example.org/rdf#numberOfCasualties": "Number of casualties",
    "http://www.example.org/rdf#numberOfInjured": "Number of injured",
    "http://purl.org/dc/elements/1.1/contributor": "Source of information for the event",
    "https://schema.org/duration": "Duration of tornado",
    "http://www.example.org/rdf#locatedOn": "Type of tornado",
    "http://www.wikidata.org/entity/Q9430": "Marine",
    "http://www.wikidata.org/entity/Q5107": "Terrestrial",
    "http://sweetontology.net/propSpeed/Speed": "Speed of tornado"
}

//Comprueba si existe el id de tornado
if (tornado_id == null) { //Muestra mensaje de error
    let tables = $('#tables')
    tables.empty()
    tables.append("<p>No parameter found on the request</p>")
}else{ //Rellena la tabla con los datos
    query = "prefix : <http://www.example.org/rdf#> \n" +
        "SELECT *  WHERE {\n" +
        "  :" + tornado_id + " ?prop ?value\n" +
        "}"
    //Envía query
    $.post('http://156.35.98.114:3030/tornados/sparql', {'query': query},
        function (returnedData) {
            let tornado_triples = returnedData.results.bindings
            //Guardar las propiedades en un mapa
            let tornado_map = new Map();
            tornado_triples.forEach(triple =>{
                tornado_map.set(triple.prop.value, triple.value.value)
            })
            //Rellenar tabla a partir del mapa
            tornado_map.forEach((val, key, tornado) =>{
                let table = $("#tornado_table")
                let row = $('<tr></tr>')
                if (uri_2_text[key] != null ){
                    if (key === "https://schema.org/endDate") //Fecha fin se muestra seguida de fecha inicio
                        return
                    row.append($('<td></td>').text(uri_2_text[key]))
                    if (key === "https://schema.org/startDate") {
                        row.append($('<td></td>').text(iso_to_date(val)))
                        table.append(row)
                        if (tornado.get("https://schema.org/endDate") != null) {
                            let new_row = $('<tr></tr>')
                            new_row.append($('<td></td>').text("End of event"))
                            new_row.append($('<td></td>').text(iso_to_date(tornado.get("https://schema.org/endDate"))))
                            table.append(new_row)
                        }
                    }else if (key === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"){
                        if (uri_2_text[val] != null){
                            row.append($('<td></td>').text(uri_2_text[val]))
                        }else{
                            let val_str = val.replace("http://stko-kwg.geog.ucsb.edu/lod/ontology/NOAA","")
                                .replace(/([A-Z])/g, " $1")
                            row.append($('<td></td>').text(val_str))
                        }
                        table.append(row)
                        //Seleccionar titulo de la página
                        if (val === "http://sweetontology.net/phenAtmoPrecipitation/Tornado"){
                            $("#result-title").text("Tornado data")
                        }else{
                            $("#result-title").text("Event data")
                        }
                    }else if (key === "https://schema.org/location"){
                        //Obtener nombre del municipio
                        let county_id = val.replace("http://www.wikidata.org/entity/", "" )
                        const url = wdk.getEntities(county_id)
                        $.get(url, {}, function (returnedData){
                            row.append($('<td></td>').text(returnedData.entities[county_id].labels.en.value))
                            table.append(row)


                        }, 'json').fail(function (){
                            console.log("Error while accessing wikidata")
                        })
                    }else if (key === "http://sweetontology.net/stateStorm/EnhancedFujitaScale"
                        || key === "http://sweetontology.net/stateStorm/FujitaPearsonScale"){
                        row.append($('<td></td>').text(val.replace("http://sweetontology.net/stateStorm/","")))
                        table.append(row)
                    }else if (key === "https://schema.org/duration"){
                        row.append($('<td></td>').text(iso_duration(val)))
                        table.append(row)
                    }else{ //Caso default
                        if (uri_2_text[val] != null){
                            row.append($('<td></td>').text(uri_2_text[val]))
                        }else {
                            row.append($('<td></td>').text(val))
                        }
                        table.append(row)
                    }
                }else if (key === "http://www.example.org/rdf#significantEvent"){
                    //Si los hay, mostrar los eventos relacionados
                    fill_related_events_section()
                }
            })
        }, 'json').fail(function (){
        console.log("Error while obtaining all tornadoes data")
    })

}
//Rellenar select
function fill_related_events_section(){
    query = "prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> \n" +
        "prefix schema: <https://schema.org/>\n" +
        "prefix : <http://www.example.org/rdf#> \n" +
        "\n" +
        "SELECT * WHERE {\n" +
        ":"+ tornado_id + " :significantEvent/rdf:rest*/rdf:first ?event .\n" +
        "\n" +
        "?event schema:location ?location ;\n" +
        "       rdf:type ?type.\n" +
        "}"

    //Realiza la petición
    $.post('http://156.35.98.114:3030/tornados/sparql', {'query': query},
        function (returnedData){
            let events = returnedData.results.bindings
            let events_section = $("#related_events")
            events_section.append("<h3>Related events</h3>")
            events.forEach(event =>{
                //Obtener nombres de municipios
                let list_counties_ids = event.location.value.replace("http://www.wikidata.org/entity/", "")
                const url = wdk.getEntities(list_counties_ids)
                $.get(url, {}, function (returnedData){
                    let type_event = event.type.value
                    let val_str = ""
                    //Obtener el tipo del eventos (Si no está en uri_2_text, es de la ontología del NOAA)
                    if (uri_2_text[type_event] != null){
                        val_str = uri_2_text[type_event]
                    }else{
                        //Quitamos el prefijo y separamos por palabras
                        val_str = type_event.replace("http://stko-kwg.geog.ucsb.edu/lod/ontology/NOAA","")
                            .replace(/([A-Z])/g, " $1")
                    }
                    let event_link = "<a href='result.html?id=" + event.event.value.replace("http://www.example.org/rdf#", "")
                        + "'><p>"+ val_str + " in " + returnedData.entities[list_counties_ids].labels.en.value + "</p></a>"
                    events_section.append(event_link)

                }, 'json').fail(function (){
                    console.log("Error while accessing wikidata")
                })
            })
        }, 'json').fail(function (){
        console.log("Error while obtaining all tornadoes data")
    })
}

//Convertir fecha ISO en fecha locale
function iso_to_date(iso_date){
    let date = new Date(iso_date)
    return date.toLocaleString()
}

//Convertir duración ISO en duración en días, horas, minutos y segundos
function iso_duration(iso_dur){
    var iso8601DurationRegex = /(-)?P(?:([.,\d]+)Y)?(?:([.,\d]+)M)?(?:([.,\d]+)W)?(?:([.,\d]+)D)?T(?:([.,\d]+)H)?(?:([.,\d]+)M)?(?:([.,\d]+)S)?/
    var matches = iso_dur.match(iso8601DurationRegex)

    let matches_map =  {
        years: matches[2] === undefined ? 0 : matches[2],
        months: matches[3] === undefined ? 0 : matches[3],
        weeks: matches[4] === undefined ? 0 : matches[4],
        days: matches[5] === undefined ? 0 : matches[5],
        hours: matches[6] === undefined ? 0 : matches[6],
        minutes: matches[7] === undefined ? 0 : matches[7],
        seconds: matches[8] === undefined ? 0 : matches[8]
    }
    
    let duration_str = ""
    for (let matchesMapKey in matches_map) {
        if (matches_map[matchesMapKey] !== 0){
            duration_str += matches_map[matchesMapKey] + " " + matchesMapKey + " "
        }
    }
    
    return duration_str
}



