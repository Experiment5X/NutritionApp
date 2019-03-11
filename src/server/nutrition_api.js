const fs = require('fs');
const request = require('request');

class NutritionApi {
    constructor(secretsFile) {
        let fileContents = fs.readFileSync(secretsFile);
        let secrets = JSON.parse(fileContents);

        let apiKey = secrets['nutrition_api_key'];
        this.urlRoot = 'https://api.nal.usda.gov/ndb/search/?format=json&api_key=' + apiKey;
    }

    search(foodSearchString, callback) {
        let searchUrl = this.urlRoot + '&sort=n&max=25&offset=0&q=' + foodSearchString;
        request(searchUrl, (error, response, body) => {
            if (error) {
                callback(error);
            } else {
                let parsedResponse = JSON.parse(body);
                let searchResults = parsedResponse['list']['item'];

                let cleanedResults = this.parseSearchResults(searchResults);
                callback(false, cleanedResults);
            }
        });
    }

    parseSearchResults(searchResults) {
        var cleaned = [];
        for (var result of searchResults) {
            let rawName = result.name;
            let nameComponents = rawName.split(',');

            result.name = nameComponents[0];
            result.type = nameComponents[1];
            result.id = nameComponents[2];

            cleaned.push(result);
        } 

        return cleaned;
    }
}

module.exports = NutritionApi;