//Conexion a wikidata
const wdk = WBK({
    instance: 'https://www.wikidata.org',
    sparqlEndpoint: 'https://query.wikidata.org/sparql'
})


//Buscar por fecha y escala
function search_by_all(){
    //Comprobar los inputs
    let start_date = $('#start_date').val()
    let end_date = $('#end_date').val()
    if (start_date === "" || end_date === "" ){
        return
    }
    let scale_selected = $('#scale_select').val()
    if (scale_selected == null){
        return
    }
    let query = "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\n" +
        "prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> \n" +
        "prefix schema: <https://schema.org/>\n" +
        "prefix : <http://www.example.org/rdf#> \n" +
        "\n" +
        "SELECT * WHERE {\n" +
        "?tornado schema:location ?location ;\n" +
        "         schema:startDate ?date ;\n" +
        "  \t\t?scale ?val .\n" +
        "  FILTER regex(xsd:string(?tornado), \"TORNADO\")\n" +
        "  FILTER (?date > \"" + start_date + "T00:00:00\"^^xsd:dateTime && \n" +
        "         ?date < \"" + end_date + "T00:00:00\"^^xsd:dateTime)\n" +
        "  FILTER (regex(xsd:string(?scale), \"EnhancedFujitaScale\") || \n" +
        "  \t\tregex(xsd:string(?scale), \"FujitaPearsonScale\"))\n" +
        "  FILTER (regex(xsd:string(?val), \""+ scale_selected + "$\") || \n" +
        "  \t\tregex(xsd:string(?val), \"E"+ scale_selected + "$\"))\n" +
        "    \n" +
        "}LIMIT 40"
    //Petición post
    $.post('http://156.35.98.114:3030/tornados/sparql', {'query': query},
        function (returnedData) {
            let search_results = $('#search-results').empty()
            let tornadoes = returnedData.results.bindings
            if (tornadoes.length === 0){ //No hay resultados
                search_results.append("<h3>No results found</h3>")
            }else{ //Hay resultados
                //Obtener nombres de municipios
                let list_counties_ids = []
                tornadoes.forEach(tornado => {
                    list_counties_ids.push(tornado.location.value.replace("http://www.wikidata.org/entity/", ""))
                })
                const url = wdk.getEntities(list_counties_ids)
                $.get(url, {}, function (returnedData){
                    let county_map = {}
                    list_counties_ids.forEach(county_id =>{
                        county_map[county_id] = returnedData.entities[county_id].labels.en.value
                    })
                    //Mostrar resultados
                    tornadoes.forEach(tornado =>{
                        let county_id = tornado.location.value.replace("http://www.wikidata.org/entity/", "")
                        let title = "<a href='result.html?id=" + tornado.tornado.value.replace("http://www.example.org/rdf#", "") + "'><h3>"+ county_map[county_id] +
                            " Tornado (" + tornado.val.value.replace("http://sweetontology.net/stateStorm/","") + ", " +
                            iso_to_date(tornado.date.value) + ")</h3></a>"
                        $('#search-results').append(title)
                    })
                }, 'json').fail(function (){
                    console.log("Error while accessing wikidata")
                })
            }
        }, 'json').fail(function (){
        console.log("Error while obtaining all tornadoes data")
    })
}

//Buscar tornados por escala
function search_by_scale(){
    //Comprobar los inputs
    let scale_selected = $('#scale_select').val()
    if (scale_selected == null){
        return
    }
    let query = "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\n" +
        "prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> \n" +
        "prefix schema: <https://schema.org/>\n" +
        "prefix : <http://www.example.org/rdf#> \n" +
        "\n" +
        "SELECT * WHERE {\n" +
        "?tornado schema:location ?location ;\n" +
        "         schema:startDate ?date ;\n" +
        "  \t\t?scale ?val .\n" +
        "  FILTER regex(xsd:string(?tornado), \"TORNADO\")\n" +
        "  FILTER (regex(xsd:string(?scale), \"EnhancedFujitaScale\") || \n" +
        "  \t\tregex(xsd:string(?scale), \"FujitaPearsonScale\"))\n" +
        "  FILTER (regex(xsd:string(?val), \""+ scale_selected + "$\") || \n" +
        "  \t\tregex(xsd:string(?val), \"E"+ scale_selected + "$\"))\n" +
        "    \n" +
        "}LIMIT 40"
    //Petición post
    $.post('http://156.35.98.114:3030/tornados/sparql', {'query': query},
        function (returnedData) {
            let search_results = $('#search-results').empty()
            let tornadoes = returnedData.results.bindings
            if (tornadoes.length === 0){ //No hay resultados
                search_results.append("<h3>No results found</h3>")
            }else{ //Hay resultados
                //Obtener nombres de municipios
                let list_counties_ids = []
                tornadoes.forEach(tornado => {
                    list_counties_ids.push(tornado.location.value.replace("http://www.wikidata.org/entity/", ""))
                })
                const url = wdk.getEntities(list_counties_ids)
                $.get(url, {}, function (returnedData){
                    let county_map = {}
                    list_counties_ids.forEach(county_id =>{
                        county_map[county_id] = returnedData.entities[county_id].labels.en.value
                    })
                    //Mostrar resultados
                    tornadoes.forEach(tornado =>{
                        let county_id = tornado.location.value.replace("http://www.wikidata.org/entity/", "")
                        let title = "<a href='result.html?id=" + tornado.tornado.value.replace("http://www.example.org/rdf#", "") + "'><h5>"+ county_map[county_id] +
                            " Tornado (" + tornado.val.value.replace("http://sweetontology.net/stateStorm/","") + ")</h5></a>"
                        $('#search-results').append(title)
                    })
                }, 'json').fail(function (){
                    console.log("Error while accessing wikidata")
                })
            }
        }, 'json').fail(function (){
        console.log("Error while obtaining all tornadoes data")
    })

}

//Buscar tornados por fecha
function search_by_date(){
    //Comprobar los inputs
    let start_date = $('#start_date').val()
    let end_date = $('#end_date').val()
    if (start_date === "" || end_date === "" ){
        return
    }
    let query = "PREFIX sophatmopc: <http://sweetontology.net/phenAtmoPrecipitation/>\n" +
    "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n" +
    "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\n" +
    "prefix schema: <https://schema.org/>\n" +
    "prefix : <http://www.example.org/rdf#> \n" +
    "SELECT *  WHERE {\n" +
    "  ?tornado schema:location ?location ;\n" +
    "     schema:startDate ?date .\n" +
    "  FILTER regex(xsd:string(?tornado), \"TORNADO\") \n" +
    "  FILTER (?date > \"" + start_date + "T00:00:00\"^^xsd:dateTime && \n" +
    "         ?date < \"" + end_date + "T00:00:00\"^^xsd:dateTime)\n" +
    "} LIMIT 20"

    //Petición post
    $.post('http://156.35.98.114:3030/tornados/sparql', {'query': query},
        function (returnedData) {
        //Vaciar resultados
            let search_results = $('#search-results').empty()
            let tornadoes = returnedData.results.bindings
            if (tornadoes.length === 0){ //No hay resultados
                search_results.append("<h3>No results found</h3>")
            }else{ //Hay resultados
                //Obtener nombres de municipios
                let list_counties_ids = []
                tornadoes.forEach(tornado => {
                    list_counties_ids.push(tornado.location.value.replace("http://www.wikidata.org/entity/", ""))
                })
                const url = wdk.getEntities(list_counties_ids)
                $.get(url, {}, function (returnedData){
                    let county_map = {}
                    list_counties_ids.forEach(county_id =>{
                        county_map[county_id] = returnedData.entities[county_id].labels.en.value
                    })
                    //Mostrar resultados
                    tornadoes.forEach(tornado =>{
                        let county_id = tornado.location.value.replace("http://www.wikidata.org/entity/", "")
                        let title = "<a href='result.html?id=" + tornado.tornado.value.replace("http://www.example.org/rdf#", "") + "'><h3>"+ county_map[county_id] +
                            " Tornado (" + iso_to_date(tornado.date.value) + ")</h3></a>"
                        $('#search-results').append(title)
                    })
                }, 'json').fail(function (){
                    console.log("Error while accessing wikidata")
                })
            }
        }, 'json').fail(function (){
        console.log("Error while obtaining all tornadoes data")
    })
}

//Convertir fecha de formato ISO a local
function iso_to_date(iso_date){
    let date = new Date(iso_date)
    return date.toLocaleString()
}