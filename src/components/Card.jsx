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
    <div className="min-h-screen bg-slate-950 px-4 py-10">
      <div className="max-w-7xl mx-auto">

        <div className="mb-10 text-center">
          <h1 className="text-5xl font-black text-white">
            Search Results
          </h1>

          <p className="text-slate-400 mt-3">
            Discover player profiles and career information
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-8">
          {playerProfile.map((player) => {
            return (
              <div
                key={player.id}
                className="
                  group
                  w-full
                  sm:w-[350px]
                  bg-slate-900/80
                  backdrop-blur-xl
                  border
                  border-slate-800
                  rounded-3xl
                  overflow-hidden
                  hover:border-purple-500/40
                  hover:-translate-y-2
                  hover:shadow-[0_20px_80px_rgba(168,85,247,0.25)]
                  transition-all
                  duration-500
                "
              >
                {/* Image */}
                <div className="relative overflow-hidden">

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10" />

                  <img
                    className="
                      w-full
                      h-[220px]
                      object-contain
                      group-hover:scale-110
                      transition-transform
                      duration-700
                    "
                    src={player.imageUrl}
                    alt=""
                  />

                  <div className="absolute bottom-4 left-4 z-20">
                    <span
                      className="
                        px-2
                        py-1
                        rounded-full
                        bg-emerald-500/20
                        border
                        border-emerald-500/30
                        text-emerald-400
                        text-sm
                        font-semibold
                      "
                    >
                      {player.position?.main}
                    </span>
                  </div>

                </div>

                {/* Content */}
                <div className="p-3">

                  <div className="text-center">

                    <h2 className="text-2xl font-bold text-white">
                      {player.name}
                    </h2>

                    <p className="text-slate-400 mt-1">
                      {player.citizenship?.[0]}
                    </p>

                  </div>

                  {/* Divider */}
                  <div className="h-px bg-slate-800 my-3" />

                  {/* Info */}
                  <div className="space-y-2">

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-sm">
                        Position
                      </span>

                      <span className="text-white font-medium">
                        {player.position?.main}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-sm">
                        Country
                      </span>

                      <span className="text-white font-medium">
                        {player.citizenship?.[0]}
                      </span>
                    </div>

                  </div>

                  {/* Button */}
                  <Link
                    to={`profile/${player.id}`}
                    state={{ player }}
                    className="
                      mt-4
                      block
                      text-center
                      py-2
                      rounded-2xl
                      bg-gradient-to-r
                      from-purple-600
                      to-cyan-600
                      font-semibold
                      text-white
                      hover:from-purple-500
                      hover:to-cyan-500
                      hover:scale-[1.02]
                      transition-all
                      duration-300
                    "
                  >
                    View Full Profile →
                  </Link>

                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  </Fragment>
);
}

export default Card;
