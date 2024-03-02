import "../App.css";
import config from "../config";

import React, { useState, useEffect } from "react";
import { Table, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./HomePage.css";

const handleButtonClick = (rowIndex) => {
    // Handle button click for the specific row (index) here
    console.log(`Button clicked for Row ${rowIndex + 1}`);
};

function HomePage({ currentUser }) {
    const navigate = useNavigate();
    const [problemSets, setProblemSets] = useState([]);
    const [users, setUsers] = useState([]);
    // ...
    useEffect(() => {
        axios
            .get("http://localhost:" + config.PORT + "/problemsets")
            .then((res) => {
                setProblemSets(res.data);
            });
    }, []);

    useEffect(() => {
        axios.get("http://localhost:" + config.PORT + "/users").then((res) => {
            setUsers(res.data);
        });
    }, [problemSets]);

    if (!users && !problemSets) {
        return <p>Loading...</p>;
    } else {
        return (
            <div classname="homepage">
                <div className="welcome-back">
                    <h1>Welcome back, {currentUser.name}!</h1>
                </div>


                <h2 className="problems-header">Problem Sets</h2>
                <div classname="search-bar">
                    <input placeholder="Problem search..."></input>
                </div>
                <Table striped bordered hover className="problem-set-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Creator</th>
                            <th>Difficulty</th>
                            <th></th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {problemSets.map((set) => {
                            return (
                                <tr>
                                    <td>{set.name}</td>
                                    <td>
                                        {users.find(
                                            (user) => user.id === set.authorID
                                        )?.name ?? "A user"}
                                    </td>
                                    <td>{set.category}</td>
                                    <td>
                                        <Button
                                            variant="primary"
                                            onClick={() => handleButtonClick(0)}
                                        >
                                            Play
                                        </Button>
                                    </td>
                                    <Button
                                        variant="primary"
                                        onClick={() =>
                                            navigate("/leaderboard/" + set.id)
                                        }
                                    >
                                        Leaderboard
                                    </Button>
                                    <td></td>
                                    {set.authorID === currentUser.id ? (
                                        <Button
                                            variant="primary"
                                            onClick={() =>
                                                navigate(
                                                    "/leaderboard/" + set.id
                                                )
                                            }
                                        >
                                            Edit
                                        </Button>
                                    ) : null}
                                </tr>
                            );
                        })}
                    </tbody>
                </Table>
                <Button className="new_problem">Create New Problem</Button>
            </div>
        );
    }
}

export default HomePage;
