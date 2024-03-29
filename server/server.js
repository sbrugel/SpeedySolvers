const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config({ path: "./config.env" });

const axios = require("axios");

// App setup code
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Connect to the database
const port = process.env.PORT || 5000;

mongoose.set("strictQuery", false);
mongoose.connect(process.env.ATLAS_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

console.log("Connected to DB");

// Schema for a registered user
const userSchema = new mongoose.Schema({
    id: Number,
    name: String,
    password: String,
    completedFullSets: [Number], // IDs of problem sets that the user has completed (100%)
    completedPartSets: [Number], // IDs of problem sets that the user has completed partially (attempted but not 100%),
    avatarURL: String
});

// Schema for an entry in the leaderboard of a problem set
const leaderboardEntrySchema = new mongoose.Schema({
    id: Number,
    userId: Number,
    score: Number, // the percentage correct
    time: Number // TODO may need to change this type
});

// Schema for a leaderboard of entries, for a specific problem set
const leaderboardSchema = new mongoose.Schema({
    id: Number, // should match the problem set ID
    entryIDs: [Number] // IDs of the leaderboard entries
});

// Schema for a single problem
const problemSchema = new mongoose.Schema({
    id: Number,
    body: String,
    answer: Number
});

// Schema for a problem set
const problemSetSchema = new mongoose.Schema({
    id: Number,
    name: String,
    authorID: Number, // the ID of the creator
    problemIDs: [Number], // IDs of problems to include
    category: String // grade level, will be implemented in front end.
});

const forumPostSchema = new mongoose.Schema({
    id: Number,
    authorID: Number,
    body: String,
    postTime: Date
});

const forumTopicSchema = new mongoose.Schema({
    id: Number,
    originalAuthorID: Number,
    title: String,
    postIDs: [Number],
    postTime: Date
});

// Models
const User = new mongoose.model("User", userSchema);
const LeaderboardEntry = new mongoose.model(
    "LeaderboardEntry",
    leaderboardEntrySchema
);
const Leaderboard = new mongoose.model("Leaderboard", leaderboardSchema);
const Problem = new mongoose.model("Problem", problemSchema);
const ProblemSet = new mongoose.model("ProblemSet", problemSetSchema);
const ForumPost = new mongoose.model("ForumPost", forumPostSchema);
const ForumTopic = new mongoose.model("ForumTopic", forumTopicSchema);

// USER ENDPOINTS
/*
- register
- login
- get all
- get by ID
*/
app.post("/register", (req, res) => {
    const { name, password } = req.body;
    const DEFAULT_AVATARS = [
        "https://cdn.discordapp.com/attachments/1213546787835740180/1213549746619162624/image.png?ex=65f5e146&is=65e36c46&hm=e2fff331bd45122903d67339e257b62618d678ac1ea06d9b89317a99c78b51e9&",
        "https://cdn.discordapp.com/attachments/1213546787835740180/1213549844107624519/image.png?ex=65f5e15d&is=65e36c5d&hm=7173786ada000063264948f2f205579cf7119629152cd3fc67562f53b9b158b7&",
        "https://cdn.discordapp.com/attachments/1213546787835740180/1213549894929875094/image.png?ex=65f5e169&is=65e36c69&hm=35a01b3110444c8f042d39452dcab31aff5c745cc35165f647b9cea2acd42e19&",
        "https://cdn.discordapp.com/attachments/1213546787835740180/1213550006896820224/image.png?ex=65f5e184&is=65e36c84&hm=ebc97d8d653ddafb5dcac19c547ed4e5e9b872ce616f09a8df9d8a16c9872225&",
        "https://cdn.discordapp.com/attachments/1213546787835740180/1213550133162025000/image.png?ex=65f5e1a2&is=65e36ca2&hm=cab75c515e618261c4973cadacfc76b5d1b5df623e03227acd71f596fd534e86&"
    ];
    User.findOne({ name: name })
        .exec()
        .then(async (user) => {
            if (user) {
                res.send({
                    message:
                        "ERROR: A user with name " + name + " already exists."
                });
            } else {
                let id = 0;
                let foundNewID = false; // TODO: this is inefficient as shit lol
                do {
                    id++;
                    await User.findOne({ id: id })
                        .exec()
                        .then((user) => {
                            if (!user) foundNewID = true;
                        });
                } while (!foundNewID);

                const user = new User({
                    id,
                    name,
                    password,
                    completedFullSets: [],
                    completedPartSets: [],
                    avatarURL:
                        DEFAULT_AVATARS[
                            Math.floor(Math.random() * DEFAULT_AVATARS.length)
                        ]
                });
                user.save()
                    .then(() => {
                        res.send({
                            message: name + " has been registered! Welcome!"
                        });
                    })
                    .catch((err) => {
                        res.send("An error occurred: " + err);
                    });
            }
        });
});

app.post("/login", (req, res) => {
    const { name, password } = req.body;
    User.findOne({ name: name })
        .exec()
        .then((user) => {
            if (user) {
                if (password === user.password) {
                    res.send({ message: "Login succeeded!", user: user });
                } else {
                    res.send({ message: "ERROR: Wrong credentials!" });
                }
            } else {
                res.send({ message: "ERROR: User doesn't exist!" });
            }
        });
});

app.get("/users", (req, res) => {
    User.find()
        .exec()
        .then((users) => {
            res.json(users);
        });
});

app.get("/users/:i", (req, res) => {
    User.findOne({ id: req.params.i })
        .exec()
        .then((entry) => {
            res.json(entry);
        });
});

// PROBLEM SET ENDPOINTS
/*
- add new (should also create a new leaderboard at the same time)
- get all
- get by ID
*/
app.post("/newset", async (req, res) => {
    const { name, authorID, category } = req.body;

    let id = 0;
    let foundNewID = false; // TODO: this is inefficient as shit lol
    do {
        id++;
        await ProblemSet.findOne({ id: id })
            .exec()
            .then((problemSet) => {
                if (!problemSet) foundNewID = true;
            });
    } while (!foundNewID);

    const problemSet = new ProblemSet({
        id,
        name,
        authorID,
        problemIDs: [],
        category
    });
    problemSet
        .save()
        .then(() => {
            const leaderboard = new Leaderboard({
                id,
                entryIDs: []
            });
            leaderboard
                .save()
                .then(() => {
                    res.send({
                        message: "Problem set and leaderboard saved!",
                        id: id
                    });
                })
                .catch((err) => {
                    res.send("ERROR: " + err);
                });
        })
        .catch((err) => {
            res.send("ERROR: " + err);
        });
});

app.get("/problemsets", (req, res) => {
    ProblemSet.find()
        .exec()
        .then((sets) => {
            res.json(sets);
        });
});

app.get("/problemsets/:i", (req, res) => {
    ProblemSet.findOne({ id: req.params.i })
        .exec()
        .then((set) => {
            res.json(set);
        });
});

// PROBLEM ENDPOINTS
/*
- add new problem to set
- get by ID
*/
app.post("/newproblem", async (req, res) => {
    const { body, answer, setID } = req.body;

    let problemID = Math.floor(Math.random() * 10000000);

    const problem = new Problem({ id: problemID, body, answer });

    problem
        .save()
        .then(() => {
            return ProblemSet.findOne({ id: setID }).exec();
        })
        .then((problemSet) => {
            if (!problemSet) {
                throw new Error("ProblemSet not found");
            }
            problemSet.problemIDs.push(problemID);
            return problemSet.save();
        })
        .then(() => {
            res.send({ message: "Problem saved!" });
        })
        .catch((err) => {
            res.send("ERROR: " + err);
        });
});

app.get("/problems", (req, res) => {
    Problem.find()
        .exec()
        .then((problems) => {
            res.json(problems);
        });
});

app.get("/problems/:i", (req, res) => {
    Problem.findOne({ id: req.params.i })
        .exec()
        .then((problem) => {
            res.json(problem);
        });
});

// LEADERBOARD ENTRY ENDPOINTS
/*
- add a new entry to a leaderboard
- get by ID
*/
app.post("/newleaderboardentry", async (req, res) => {
    const { userId, time, leaderboardID } = req.body;

    let entryID = 0;
    let foundNewID = false; // TODO: this is inefficient as shit lol
    do {
        entryID++;
        await LeaderboardEntry.findOne({ id: entryID })
            .exec()
            .then((entry) => {
                if (!entry) foundNewID = true;
            });
    } while (!foundNewID);

    const entry = new LeaderboardEntry({ id: entryID, userId, score: 0, time });
    entry
        .save()
        .then(() => {
            Leaderboard.findOne({ id: leaderboardID })
                .exec()
                .then((leaderboard) => {
                    leaderboard.entryIDs.push(entryID);
                    leaderboard.save().then(() => {
                        res.send({ message: "Leaderboard entry saved!" });
                    });
                });
        })
        .catch((err) => {
            res.send("ERROR: " + err);
        });
});

app.get("/leaderboardentries", (req, res) => {
    LeaderboardEntry.find()
        .exec()
        .then((entries) => {
            res.json(entries);
        });
});

app.get("/leaderboardentries/:i", (req, res) => {
    LeaderboardEntry.findOne({ id: req.params.i })
        .exec()
        .then((entry) => {
            res.json(entry);
        });
});

// LEADERBOARD ENDPOINTS
/*
- get by ID
*/
app.get("/leaderboard/:i", (req, res) => {
    Leaderboard.findOne({ id: req.params.i })
        .exec()
        .then((leaderboard) => {
            res.json(leaderboard);
        });
});

// FORUM TOPIC ENDPOINTS
/*
- add new
- get all
*/
app.post("/topic", async (req, res) => {
    const { originalAuthorID, title } = req.body;

    let id = 0;
    let foundNewID = false; // TODO: this is inefficient as shit lol
    do {
        id++;
        await ForumTopic.findOne({ id: id })
            .exec()
            .then((topic) => {
                if (!topic) foundNewID = true;
            });
    } while (!foundNewID);

    const forumTopic = new ForumTopic({
        id,
        originalAuthorID,
        title,
        postIDs: [],
        postTime: Date.now()
    });
    forumTopic
        .save()
        .then(() => {
            res.end({ message: "New topic created!" });
        })
        .catch((err) => {
            res.send("ERROR: " + err);
        });
});

app.get("/topics", (req, res) => {
    ForumTopic.find()
        .exec()
        .then((topics) => {
            res.json(topics);
        });
});

// FORUM POST ENDPOINTS
/*
- add new to topic
- get all
*/
app.post("/newpost", async (req, res) => {
    const { authorID, body, threadID } = req.body;

    let postID = Math.floor(Math.random() * 10000000);

    const post = new ForumPost({
        id: postID,
        authorID,
        body,
        postTime: Date.now()
    });

    post.save()
        .then(() => {
            return ForumTopic.findOne({ id: threadID }).exec();
        })
        .then((topic) => {
            if (!topic) {
                throw new Error("topic not found");
            }
            topic.postIDs.push(postID);
            return topic.save();
        })
        .then(() => {
            res.send({ message: "Post saved!" });
        })
        .catch((err) => {
            res.send("ERROR: " + err);
        });
});

app.get("/posts", (req, res) => {
    ForumPost.find()
        .exec()
        .then((posts) => {
            res.json(posts);
        });
});

app.listen(port, () => {
    console.log("Server is now started");
});
