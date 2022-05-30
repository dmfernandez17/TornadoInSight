function petition(){
    var req = new XMLHttpRequest();
    req.open('POST', 'http://156.35.98.114:3030/tornados/sparql', false);
    params = "query=prefix xsd: <http://www.w3.org/2001/XMLSchema%23> prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns%23> prefix wikidata: <http://www.wikidata.org/entity/> prefix schema: <https://schema.org/> prefix event: <https://www.ncdc.noaa.gov/stormevents/eventdetails.jsp?id=>    SELECT * WHERE { event:816403 wikidata:P276 ?var . }"
    
    req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    req.setRequestHeader("Accept", "application/sparql-results+json")
    
    req.send(params);

    console.log(req.responseText);


    document.getElementById("prueba").innerHTML = ""
    
}