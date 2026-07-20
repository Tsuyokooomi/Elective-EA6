const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = 4000;

// ==========================================
// MongoDB Configuration
// ==========================================
const url = "mongodb://127.0.0.1:27017";
const dbName = "studentDB1";
const collectionName = "students";

let db;

// Connect to MongoDB
async function connectDatabase() {
    try {
        const client = new MongoClient(url);
        await client.connect();
        db = client.db(dbName);
        console.log(`Connected to MongoDB Database: ${dbName}`);
    } catch (err) {
        console.log(err);
    }
}

connectDatabase();

// ==========================================
// Upload Directories
// ==========================================
// multer's diskStorage does not create destination folders on its own,
// so make sure they exist before any file hits the server.
const uploadDirs = [
    path.join(__dirname, "uploads", "photo"),
    path.join(__dirname, "uploads", "certificate")
];
uploadDirs.forEach((dir) => fs.mkdirSync(dir, { recursive: true }));

// ==========================================
// View Engine
// ==========================================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ==========================================
// Middleware
// ==========================================
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ==========================================
// Multer Storage Configuration
// ==========================================
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === "photo") {
            cb(null, "uploads/photo/");
        } else if (file.fieldname === "certificate") {
            cb(null, "uploads/certificate/");
        }
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

// ==========================================
// Multer Middleware
// ==========================================
const upload = multer({ storage: storage });

// ==========================================
// Home Page
// ==========================================
app.get("/", (req, res) => {
    res.render("index");
});

// ==========================================
// Upload Route
// ==========================================
app.post(
    "/upload",
    upload.fields([
        { name: "photo", maxCount: 1 },
        { name: "certificate", maxCount: 1 }
    ]),
    async (req, res) => {
        try {
            const student = {
                studentID: req.body.studentID,
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                photo: req.files.photo
                    ? "photo/" + req.files.photo[0].filename
                    : "",
                certificate: req.files.certificate
                    ? "certificate/" + req.files.certificate[0].filename
                    : "",
                uploadDate: new Date()
            };

            // Save to MongoDB
            await db.collection(collectionName).insertOne(student);

            console.log("Student Saved Successfully");
            console.log(student);

            // Rendered via EJS (auto-escaped) rather than a raw HTML string,
            // so submitted values can't inject markup into the page.
            res.render("success", { student });
        } catch (err) {
            console.log(err);
            res.status(500).send("Error saving student information.");
        }
    }
);

// ==========================================
// Start Server
// ==========================================
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
