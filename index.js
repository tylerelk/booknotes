import pg from "pg";
import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public/"));

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
  //for entries
  view: "SELECT * FROM media WHERE id = $1",
  edit: "UPDATE media SET title = $1, artist = $2 WHERE id = $3",
  delete: "DELETE FROM media WHERE id = $1",
  add: "INSERT INTO media (title, artist, genre, cover_url) VALUES ($1, $2, $3, $4)",
  //for notes
  notes:
    "SELECT * FROM media JOIN notes ON media.id = media_id WHERE media.id = $1 ORDER BY created_at ASC",
  newNote: "INSERT INTO notes (media_id, note) VALUES ($1, $2)",
  editNote: "UPDATE notes SET note = $1 WHERE id = $2",
  deleteNote: "DELETE FROM notes WHERE id = $1",
};

async function getMedia() {
  let media = [];
  const result = await db.query("SELECT * FROM media ORDER BY created_at ASC");
  result.rows.forEach((row) => media.push(row));
  return media;
}

//HTTP responses
app.get("/", async (req, res) => {
  const media = await getMedia();
  res.render("index.ejs", {
    media: media,
    editing: editing,
  });
});

app.post("/new", async (req, res) => {
  if (editing.edit) {
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
    let covers = await axios.request({
      method: "GET",
      url: "https://spotify23.p.rapidapi.com/search/",
      params: {
        q: `${req.body.title} ${req.body.artist}`,
        type: "multi",
        offset: "0",
        limit: "10",
        numberOfTopResults: "5",
      },
      headers: {
        "X-RapidAPI-Key": "a4f834c5e8mshfbbc3a59eb5451fp1864e1jsn588f990650d6",
        "X-RapidAPI-Host": "spotify23.p.rapidapi.com",
      },
    });
    let newEntry = [covers.data.albums.items[0].data.name, covers.data.albums.items[0].data.artists.items[0].profile.name, req.body.genre, covers.data.albums.items[0].data.coverArt.sources[2].url];
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
  let notes = await db.query(databaseMethods.notes, [req.body.viewEntry]);
  res.render("media.ejs", { media: selected.rows[0], notes: notes.rows });
});

app.post("/edit", (req, res) => {
  editing = {
    edit: true,
    editId: +req.body.editEntry,
  };
  res.redirect("/");
});

app.post("/notes", async (req, res) => {
  switch (req.body.noteAlterType) {
    case "add":
      await db.query(databaseMethods.newNote, [
        req.body.noteMediaId,
        req.body["new-note"],
      ]);
      break;
    case "edit":
      await db.query(databaseMethods.editNote, [
        req.body["edit-note"],
        req.body.noteId,
      ]);
      break;
    case "delete":
      await db.query(databaseMethods.deleteNote, [req.body.noteId]);
      break;
  }
  res.redirect("/");
});

app.post("/delete", async (req, res) => {
  await db.query(databaseMethods.delete, [req.body.deleteEntry]);
  res.redirect("/");
});

app.listen(port, (err) => {
  console.log(`Listening on port ${port}`);
});
