//Variable mapa
var map
//Conexion a wikidata
const wdk = WBK({
    instance: 'https://www.wikidata.org',
    sparqlEndpoint: 'https://query.wikidata.org/sparql'
})

const ALL_TORNADOES_QUERY = "prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> \n" +
    "prefix sophatmopc: <http://sweetontology.net/phenAtmoPrecipitation/>\n" +
    "prefix schema: <https://schema.org/> \n" +
    "prefix : <http://www.example.org/rdf#> \n" +
    "\n" +
    "SELECT * WHERE {\n" +
    "\t\t\t?Tornado rdf:type sophatmopc:Tornado;\n" +
    "\t\t\tschema:latitude ?lat ;\n" +
    "\t\t\tschema:longitude ?long;\n" +
    "}"

const TORNADOES_WITH_RELATED_QUERY_1 = "prefix sostst: <http://sweetontology.net/stateStorm/>\n" +
    "prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> \n" +
    "prefix sophatmopc: <http://sweetontology.net/phenAtmoPrecipitation/>\n" +
    "prefix schema: <https://schema.org/> \n" +
    "prefix : <http://www.example.org/rdf#> \n" +
    "\n" +
    "SELECT ?Tornado ?escale ?county WHERE {\n" +
    "  ?Tornado rdf:type sophatmopc:Tornado;\n" +
    "           :significantEvent ?list ;\n" +
    "           schema:location ?county;\n" +
    "            sostst:EnhancedFujitaScale ?escale .\n" +
    "} LIMIT 35"

const TORNADOES_WITH_RELATED_QUERY_2 = "prefix sostst: <http://sweetontology.net/stateStorm/>\n" +
    "prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> \n" +
    "prefix sophatmopc: <http://sweetontology.net/phenAtmoPrecipitation/>\n" +
    "prefix schema: <https://schema.org/> \n" +
    "prefix : <http://www.example.org/rdf#> \n" +
    "\n" +
    "SELECT ?Tornado ?escale ?county WHERE {\n" +
    "  ?Tornado rdf:type sophatmopc:Tornado;\n" +
    "           :significantEvent ?list ;\n" +
    "           schema:location ?county;\n" +
    "            sostst:FujitaPearsonScale ?escale .\n" +
    " } LIMIT 10"

var greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});


var blueIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

//Inicializa el mapa
function init_map() {
    // Crear opciones del mapa (coordenadas de vista y zoom)
    var mapOptions = {
        center: [40, -100],
        zoom: 4
    }

    // Crear el objeto mapa
    map = new L.map('map', mapOptions);

    // Crea el objeto layer
    var layer = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');

    // Añade la vista al mapa
    map.addLayer(layer);
}

function init_select(){
    //Obtener tornados con escala Enhanced Fujita
    $.post('http://156.35.98.114:3030/tornados/sparql', {'query': TORNADOES_WITH_RELATED_QUERY_1},
        function (returnedData){
            let tornadoes_1 = returnedData.results.bindings
            //Obtener tornados con escala Fujita
            $.post('http://156.35.98.114:3030/tornados/sparql', {'query': TORNADOES_WITH_RELATED_QUERY_2},
                function (returnedData){
                    let tornadoes_2 = returnedData.results.bindings
                    //Juntar todos los tornados
                    let tornadoes = [...new Set([...tornadoes_1, ...tornadoes_2])];
                    //Obtener los ids de Wikidata de los Counties
                    let list_counties_ids = []
                    tornadoes.forEach(tornado => {
                        list_counties_ids.push(tornado.county.value.replace("http://www.wikidata.org/entity/", ""))
                    })
                    const url = wdk.getEntities(list_counties_ids)
                    //Obtener los nombres de los Counties
                    $.get(url, {}, function (returnedData){
                        let county_map = {}
                        list_counties_ids.forEach(county_id =>{
                            county_map[county_id] = returnedData.entities[county_id].labels.en.value
                        })
                        //Crear elementos del select
                        tornadoes.forEach(tornado =>{
                            let county_id = tornado.county.value.replace("http://www.wikidata.org/entity/", "")
                            let select_text = county_map[county_id]+" Tornado ("
                                + tornado.escale.value.replace("http://sweetontology.net/stateStorm/", "") + ")"
                            $('#tornado_select')
                                .append($("<option></option>")
                                    .attr("value", tornado.Tornado.value.replace("http://www.example.org/rdf#", ""))
                                    .text(select_text));
                        })
                    }, 'json').fail(function (){
                        console.log("Error while accessing wikidata")
                    })
                }, 'json').fail(function (){
                console.log("Error while obtaining all tornadoes data")
            })
        }, 'json').fail(function (){
        console.log("Error while obtaining all tornadoes data")
    })
}

//Obtiene el tornado y eventos relacionados y los muestra en el mapa
function get_tornado_and_related(){
    let tornado_id = $('#tornado_select').val()
    if (tornado_id != null){
        //Borra los marcadores anteriores
        delete_all_markers()

        let query = "prefix schema: <https://schema.org/>\n" +
            "prefix : <http://www.example.org/rdf#> \n" +
            "\n" +
            "SELECT * WHERE {\n" +
            "  :" + tornado_id + " schema:latitude ?lat ;\n" +
            "        schema:longitude ?long .\n" +
            "  \n" +
            "}"
        $.post('http://156.35.98.114:3030/tornados/sparql', {'query': query},
            function (returnedData){
                tornadoes = returnedData.results.bindings
                let main_marker
                tornadoes.forEach(tornado => {
                            main_marker =L.marker([parseFloat(tornado.lat.value), parseFloat(tornado.long.value)],{icon: blueIcon}).addTo(map);
                            })
                query = "prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> \n" +
                    "prefix schema: <https://schema.org/>\n" +
                    "prefix : <http://www.example.org/rdf#> \n" +
                    "\n" +
                    "SELECT * WHERE {\n" +
                    "  :" + tornado_id + " :significantEvent/rdf:rest*/rdf:first ?event .\n" +
                    "  \n" +
                    "  ?event schema:latitude ?lat ;\n" +
                    "        schema:longitude ?long .\n" +
                    "}"

                $.post('http://156.35.98.114:3030/tornados/sparql', {'query': query},
                    function (returnedData){
                        tornadoes = returnedData.results.bindings
                        console.log(tornadoes)
                        //Crea marcador por cada tornado
                        tornadoes.forEach(tornado => {
                            //Mover el centro del mapa
                            map.setView([tornado.lat.value, tornado.long.value], 6)

                            L.marker([parseFloat(tornado.lat.value), parseFloat(tornado.long.value)],{icon: greenIcon}).addTo(map);
                            console.log("aaaaaaaa")
                        })
                    }, 'json').fail(function (){
                    console.log("Error while obtaining all tornadoes data")
                })

            }, 'json').fail(function (){
            console.log("Error while obtaining all tornadoes data")
        })
    }
}

//Borra todos los marcadores del mapa
function delete_all_markers() {
    map.eachLayer(function(layer) {
        if( layer instanceof L.Marker )
            map.removeLayer(layer)
    });
}

//Muestra todos los tornados en el mapa
function get_all_tornadoes() {
    $.post('http://156.35.98.114:3030/tornados/sparql', {'query': ALL_TORNADOES_QUERY},
        function (returnedData){
            tornadoes = returnedData.results.bindings
            tornadoes.forEach(tornado => {
                L.marker([parseFloat(tornado.lat.value), parseFloat(tornado.long.value)],{}).addTo(map);
            })
        }, 'json').fail(function (){
        console.log("Error while obtaining all tornadoes data")
    })
}

init_map()
init_select()
  