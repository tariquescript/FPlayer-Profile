// import { useState } from "react";
// import Home from '../pages/Home'
import React, { useState, useEffect } from "react";
import { Fragment } from "react";
import { Link } from "react-router-dom";

function Card({ searchButtonInput, getPlayer }) {
  const [playerId, setPlayerId] = useState("");
  const [playerProfile, setPlayerProfile] = useState([]);

  useEffect(() => {
    if (!getPlayer.length) return;

    async function loadprofiles() {
      const responses = await Promise.all(
        getPlayer.map((player) => {
          return fetch(`https://transfermarkt-api-82dl.onrender.com/players/${player.id}/profile`);
        }),
      );
      const profiles = await Promise.all(
        responses.map((res) => {
          return res.json();
        }),
      );
      console.log(profiles);
      setPlayerProfile(profiles);
    }
    loadprofiles();
  }, [getPlayer]);

  return (
    <Fragment>
      <div className="flex flex-wrap gap-5 w-[85%] justify-center mx-auto">
        {playerProfile.map((player) => {
          return (
            <div
              className="mt-4 min-w-[30%] shadow-xl mb-2 p-5 rounded-xl bg-black text-white flex flex-col border-1 mx-auto border-purple-900 items-center"
              key={player.id}
            >
              <div className="mb-5">
                <img className="rounded-xl" src={player.imageUrl} alt="" />
              </div>
              <div className="mb-2 flex flex-col text-center flex-wrap ">
                <p className="text-xl" > {player.name} </p>
                <p className="text-md" > Country : {player.citizenship[0]} </p>
              </div>
              <div className="gap-2  ">
                <Link to={`profile/${player.id}`} state={{player}}>
                  <p className="underline text-md">Click to get more details</p>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </Fragment>
  );
}

export default Card;
