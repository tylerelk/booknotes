import pg from "pg";
import express from "express";
import bodyParser from "body-parser";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "media",
  password: "Magnolia21!",
  port: 5432,
});

db.connect();

let editing = {
  edit: false,
  editId: 0,
};

//Databse access functions
const databaseMethods = {
  view: "SELECT * FROM media WHERE id = $1",
  notes: "SELECT note FROM media JOIN notes ON media.id = media_id WHERE id = $1",
  edit: "UPDATE media SET title = $1, artist = $2 WHERE id = $3",
  delete: "DELETE FROM media WHERE id = $1",
  add: "INSERT INTO media (title, artist, type) VALUES ($1, $2, $3)",
};

async function getMedia() {
  let media = [];
  const result = await db.query("SELECT * FROM media ORDER BY created_at ASC");
  result.rows.forEach((row) => media.push(row));
  return media;
}

//HTTP responses
app.get("/", async (req, res) => {
  res.render("index.ejs", {
    media: await getMedia(),
    editing: editing,
  });
});

app.post("/new", async (req, res) => {
  if (req.body.editType) {
    let edit = [req.body.title, req.body.artist, req.body.editEntry];
    try {
      await db.query(databaseMethods.edit, edit);
      editing = {
        edit: false,
        editId: 0,
      };
      res.redirect("/");
    } catch (err) {
      console.log(err);
      res.redirect("/");
    }
  } else {
    let newEntry = [req.body.title, req.body.artist, req.body["type-selector"]];
    try {
      await db.query(databaseMethods.add, newEntry);
      res.redirect("/");
    } catch (err) {
      console.log(err);
      res.redirect("/");
    }
  }
});

app.post("/view", async (req, res) => {
    let selected = await db.query(databaseMethods.view, [req.body.viewEntry]);
    let notes = await db.query(databaseMethods.notes, [req.body.viewEntry])
  res.render("media.ejs", {media: selected.rows[0], notes: notes.rows});
});

app.post("/edit", (req, res) => {
  editing = {
    edit: true,
    editId: +req.body.editEntry,
  };
  res.redirect("/");
});

app.post("/delete", async (req, res) => {
  await db.query(databaseMethods.delete, [req.body.deleteEntry]);
  res.redirect("/");
});

app.listen(port, (err) => {
  console.log(`Listening on port ${port}`);
});
