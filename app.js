const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');

let users = [
    {
        name: 'admin',
        password: 'admin',
    },
];
let posts = [
    {
        user: 'Hacker 1',
        title: 'See exclusive content (delete)',
        content: `Click this link to see exclusive content`,
        link: 'http://localhost:5500/vulnerable-delete.html',

    },
    {
        user: 'Hacker 2',
        title: 'See exclusive content (add)',
        content: `Click this link to see exclusive content`,
        link: 'http://localhost:5500/vulnerable-add.html',
    },
    {
        user: 'admin',
        title: 'Welcome to my blog',
        content: `Hello everyone, my name is Pawel and I'm the author of this blog. Enjoy :D`,
    },
];

const findUser = (name) => users.find((e) => e.name == name);

const requireUser = function (req, res, next) {
    const user = findUser(req.cookies.token);
    if (!user) return res.redirect('/unauthorized');

    req.user = user;
    next();
};

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('src'));
const csrfProtection = csrf({ cookie: true });
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.json());



//* Views
// Apply CSRF protection middleware to routes
app.get('/', function (req, res) {
    const user = findUser(req.cookies.token);
    res.render('home', {user, users});
});
app.get('/login', function (req, res) {
    res.render('login');
});
app.get('/unauthorized', function (req, res) {
    res.render('unauthorized');
});
app.get('/logout', function (req, res) {
    res.cookie('token', '');
    res.render('logout');
});
app.get('/posts', function (req, res) {
    res.render('posts', {posts});
});
app.get('/contact', (req, res) => {
    res.render('contact', { name: 'Your Name', content: 'Your Message' });
});
app.get('/addPost', requireUser, function (req, res) {
    res.render('addPost');
});
app.get('/unauthorized', requireUser, function (req, res) {
    res.render('addPost');
});
app.get('/deleteAccount', requireUser, csrfProtection, function(req, res) {
    res.render('deleteAccount', { csrfToken: req.csrfToken() });
});



//* Routes
app.post('/addPost', requireUser, function (req, res) {
    let {title, content} = req.body;

    if (content) content = content.trim();
    if (!content) return res.status(400).send('Content is required');

    if (title) title = title.trim();

    posts.unshift({title: title || 'No title', content, user: req.user.name});
    res.redirect('/posts');
});
app.post('/deleteAccount', requireUser, csrfProtection, function(req, res) {
    // Handle account deletion request
    // res.render('deleteAccount', {csrfToken: req.csrfToken()});
    users = users.filter((e) => e.name !== req.user.name);
    res.redirect('/');
});

app.post('/login', function (req, res) {
    let {name, password} = req.body;
    name = name.trim();

    if (name) name = name.trim();
    if (!name) return res.status(400).send('Name is required');

    if (!password) {
        return res.status(400).send('Password is required');
    }
    const user = findUser(name);
    if (user) {
        if (user.password !== password) {
            return res.status(400).send('Invalid password');
        }
    } else {
        users.push({name, password});
    }

    res.cookie('token', name);
    res.redirect('/');
});
app.post('/contact', (req, res) => {
    // Log the received content
    if (req.body.content) {
        console.log("Data:", req.body.content);
        res.send(req.body.content); // Send back the received content as response
    } else {
        console.error("No content received");
        res.status(400).send("No content received");
    }
});


app.listen(3000, () => {
    console.log('running');
});
