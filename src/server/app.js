const express = require('express');
const path = require('path');
const mustache = require('mustache');
const bodyParser = require("body-parser");
const fs = require('fs');
const app = express();
const NutritionApi = require('./nutrition_api');
const session = require('express-session');

const projectRoot = path.join(__dirname, '../..');
const secretsPath = path.join(projectRoot, 'secrets.json');
const templatesRoot = path.join(projectRoot, 'src/templates');

function respondWithMustache(res, templateName, context) {
    let searchTemplatePath = path.join(templatesRoot, templateName);
    let searchTemplate = fs.readFileSync(searchTemplatePath, 'utf8');

    let html = mustache.render(searchTemplate, context);
    res.send(html);
}

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
    secret: 'nutrition-secret'
}));

app.get('/search', (req, res) => {
    let previousSearch = null;
    if (req.session.searchHistory) {
        previousSearch = req.session.searchHistory[req.session.searchHistory.length - 1];
    }

    respondWithMustache(res, 'search.mustache', {'previousSearch': previousSearch});
});

app.post('/search', (req, res) => {
    let searchQuery = req.body.query;
    if (req.session.searchHistory) {
        req.session.searchHistory.push(searchQuery)
    } else {
        req.session.searchHistory = [searchQuery];
    }

    let nutrition = new NutritionApi(secretsPath);
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

app.listen(3000, () => {
    console.log('Listening on port 3000');
});
