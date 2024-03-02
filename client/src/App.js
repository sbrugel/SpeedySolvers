import "./App.css";
import React, { useState } from "react";
import { Route, Routes } from "react-router-dom";

import Register from "./components/Register";
import Login from "./components/Login";
import HomePage from "./components/HomePage";
import Leaderboard from "./components/Leaderboard";

function App() {
    const [user, setLoginUser] = useState({});

    return (
        <div className="App">
            <div className="App">
                <Routes>
                    <Route
                        path="/"
                        element={
                            user && user._id ? (
                                <HomePage currentUser={user} />
                            ) : (
                                <Login setLoginUser={setLoginUser} />
                            )
                        }
                    />
                    <Route
                        path="/leaderboard"
                        element={
                            user && user._id ? (
                                <Leaderboard />
                            ) : (
                                <Login setLoginUser={setLoginUser} />
                            )
                        }
                    />

                    <Route exact path="/register" element={<Register />} />
                    <Route
                        exact
                        path="/login"
                        element={<Login setLoginUser={setLoginUser} />}
                    />
                </Routes>
            </div>
        </div>
    );
}

export default App;
