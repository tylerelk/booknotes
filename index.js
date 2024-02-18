import pg from 'pg';
import express from 'express';
import bodyParser from 'body-parser';

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const db = new pg.Client({
    user: 'postgres',
    host: 'localhost',
    database: 'media',
    password: 'Magnolia21!',
    port: 5433,
});

db.connect();

//Databse access functions
const databaseMethods = {
    view: 'SELECT $1 FROM media',
    edit: 'UPDATE media SET (title, artist, notes) WHERE id = $1',
    delete: 'DELETE FROM media WHERE id = $1',
    add: 'INSERT INTO media (title, type, artist) VALUES ($1, $2, $3)'
};

async function getMedia() {
    let media = [];
    const result = await db.query('SELECT * FROM media ORDER BY date_added ASC');
    result.rows.forEach(row => media.push(row));
    return media;
};

//HTTP responses
app.get('/', async (req, res) => {
    res.render('index.ejs', {
        media: await getMedia()
    });
});

app.post('/new', (req, res) => {
    console.log(req.body);
    res.redirect('/');
});

app.post('/view', (req, res) => {
    console.log(req.body);
    res.redirect('/');
})

app.post('/edit', (req, res) => {
    console.log(req.body);
    res.redirect('/');
});

app.post('/delete', (req, res) => {
    console.log(req.body);
    res.redirect('/');
});

app.listen(port, (err) => {
    console.log(`Listening on port ${port}`);
})