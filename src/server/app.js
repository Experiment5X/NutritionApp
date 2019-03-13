const express = require('express');
const path = require('path');
const mustache = require('mustache');
const bodyParser = require("body-parser");
const fs = require('fs');
const app = express();
const NutritionApi = require('./nutrition_api');
const session = require('express-session');

// determine useful paths in the project directory structure
const projectRoot = path.join(__dirname, '../..');
const secretsPath = path.join(projectRoot, 'secrets.json');
const templatesRoot = path.join(projectRoot, 'src/templates');

// responds to a web request with a rendered mustache template (HTML content)
function respondWithMustache(res, templateName, context) {
    let searchTemplatePath = path.join(templatesRoot, templateName);
    let searchTemplate = fs.readFileSync(searchTemplatePath, 'utf8');

    let html = mustache.render(searchTemplate, context);
    res.send(html);
}

// allows us to get the content from a form submission
app.use(bodyParser.urlencoded({
    extended: true
}));

// set up the session
app.use(session({
    secret: 'nutrition-secret'
}));

// called when user navigates to search page
app.get('/search', (req, res) => {
    let previousSearch = null;

    // check if the search history has been stored in the session yet
    if (req.session.searchHistory) {
        previousSearch = req.session.searchHistory[req.session.searchHistory.length - 1];
    }

    respondWithMustache(res, 'search.mustache', {'previousSearch': previousSearch});
});

// called when user searches for a food (they submit the form)
app.post('/search', (req, res) => {
    // handle maintaining the search history
    let searchQuery = req.body.query;
    if (req.session.searchHistory) {
        req.session.searchHistory.push(searchQuery)
    } else {
        req.session.searchHistory = [searchQuery];
    }

    let nutrition = new NutritionApi(secretsPath);

    // ask the nutrition object to hit the government API
    // and give it a callback to be called when the API has responded
    nutrition.search(searchQuery, (error, results) => {
        if (error) {
            res.send('Error searching: ' + error.toString());
        } else {
            let context = {
                'query': searchQuery,
                'results': results
            };

            respondWithMustache(res, 'search.mustache', context);
        }
    });
});

// start the webserver
app.listen(3000, () => {
    console.log('Listening on port 3000');
});
