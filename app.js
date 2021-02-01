var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var neo4j = require('neo4j-driver');

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

var driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', 'user'));
var session = driver.session();

app.get('/', function (req, res) {

    session
        .run('MATCH(n:User) RETURN n LIMIT 25')
        .then(function (result) {
            var userArray = [];
            result.records.forEach(function (record) {
                userArray.push({
                    id: record._fields[0].identity.low,
                    name: record._fields[0].properties.name
                });
               
            });

            session
                .run('MATCH(n:Post) RETURN n LIMIT 25')
                .then(function (result) {
                    var postArray = [];
                    result.records.forEach(function (record) {
                        postArray.push({
                            id: record._fields[0].identity.low,
                            name: record._fields[0].properties.name,
                            url:record._fields[0].properties.url,
                        });
                        console.log(record._fields[0].properties);
                    });
                    res.render('index', {
                        users: userArray,
                        posts: postArray
                    })
                 
                })
                .catch(function (err) {
                    console.log(err);
                });

        })
        .catch(function (err) {
            console.log(err);
        });
});

app.post('/post/add', async function (req, res) {
    var name = req.body.postName;
    var url = req.body.imgName;

    await session
        .run('CREATE(n:Post {name:{nameParam},url:{urlParam}}) RETURN n.name', { nameParam: name, urlParam: url })
        .then(function (result) {
             res.redirect('/');
        })
        .catch(function (err) {
            console.log(err);
        }) 
         res.redirect('/');
});

app.post('/user/post/add', async function (req, res) {
    var userName = req.body.userName;
    var postName = req.body.postName;

    await session
        .run('MATCH(u:User {name:{userNameParam}}),(b:Post{name:{postNameParam}}) MERGE (u)-[r:postavio]-(b) RETURN u,b', { userNameParam: userName, postNameParam: postName })
        .then(function (result) {
             res.redirect('/');
        })
        .catch(function (err) {
            console.log(err);
        }) 
         res.redirect('/');
});


app.post ('/post/delete', async function (req, res) {
   
    var postName = req.body.postName;

    await session
        .run('MATCH (n:Post {name:{postNameParam}}) DETACH DELETE n', {  postNameParam: postName })
        .then(function (result) {
             res.redirect('/');
        })
        .catch(function (err) {
            console.log(err);
        }) 
         res.redirect('/');
});

app.post ('/post/update', async function (req, res) {
   
    var postName = req.body.postName;
    var url=req.body.postUrl;

    await session
        .run('MATCH (n:Post {name:{postNameParam}}) SET n.url={postUrlParam}', {  postNameParam: postName, postUrlParam:url})
        .then(function (result) {
             res.redirect('/');
        })
        .catch(function (err) {
            console.log(err);
        }) 
         res.redirect('/');
});

app.post ('/user/add', async function (req, res) {
   
    var name = req.body.userName;
    

    await session
        .run('CREATE(n:User {name:{nameParam}}) RETURN n', {  nameParam: name })
        .then(function (result) {
             res.redirect('/');
        })
        .catch(function (err) {
            console.log(err);
        }) 
         res.redirect('/');
});


app.listen(3000);
console.log('Server Started on Port 3000');

module.exports = app;