import instaPic from '../assets/instagram.svg'
import xPic from '../assets/twitter.svg'
import youtubePic from '../assets/youtube.svg'
import facebookPic from '../assets/facebook.svg'
import portfolioPic from '../assets/portfolio.svg'
import tiktokPic from '../assets/tiktok.svg'
import twitchPic from '../assets/twitch.svg'

function PlayerCard({ playerProfile }) {
  return (
    <>
      <div className="min-h-screen bg-slate-950 py-10 px-4">
        <div className="max-w-7xl mx-auto">

          {/* Main Card */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">

            {/* Hero Banner */}
            <div className="h-32 bg-gradient-to-r from-cyan-900 via-slate-900 to-cyan-900"></div>

            <div className="p-8">
              <div className="-mt-24 flex max-lg:flex-col gap-8">

                {/* LEFT SECTION */}
                <div className="lg:w-[30%] flex flex-col items-center">

                  <img
                    src={playerProfile.imageUrl}
                    alt=""
                    className="
                      w-64
                      h-64
                      object-contain
                      rounded-3xl
                      border-4
                      border-slate-900
                      shadow-2xl
                      hover:scale-105
                      transition-all
                      duration-500
                    "
                  />

                  <h1 className="mt-6 text-4xl font-black text-white text-center">
                    {playerProfile.name}
                  </h1>

                  <h1 className="mt-3 text-slate-400 text-lg text-center">
                    {playerProfile.club.name}
                  </h1>

                  <h1 className="
                    mt-4
                    px-4
                    py-2
                    rounded-full
                    bg-emerald-500/10
                    border
                    border-emerald-500/30
                    text-emerald-400
                    font-semibold
                  ">
                    {playerProfile.position.main}
                  </h1>

                  <h2 className="mt-4 text-purple-400 font-bold text-xl">
                    Jersey No. {playerProfile.shirtNumber}
                  </h2>

                </div>

                {/* CENTER SECTION */}
                <div className="flex-1">

                  <h2 className="text-3xl font-bold text-white mb-6">
                    Player Information
                  </h2>

                  <div className="grid md:grid-cols-2 gap-4">

                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 hover:border-purple-500/30 transition-all">
                      <p className="text-slate-400 text-sm mb-1">Full Name</p>
                      <p className="text-white font-medium">
                        {playerProfile.fullName || playerProfile.nameInHomeCountry}
                      </p>
                    </div>

                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 hover:border-purple-500/30 transition-all">
                      <p className="text-slate-400 text-sm mb-1">Place of Birth</p>
                      <p className="text-white font-medium">
                        {playerProfile.placeOfBirth.city}, {playerProfile.placeOfBirth.country}
                      </p>
                    </div>

                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 hover:border-purple-500/30 transition-all">
                      <p className="text-slate-400 text-sm mb-1">Height</p>
                      <p className="text-white font-medium">
                        {playerProfile.height}
                      </p>
                    </div>

                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 hover:border-purple-500/30 transition-all">
                      <p className="text-slate-400 text-sm mb-1">Citizenship</p>
                      <p className="text-white font-medium">
                        {playerProfile.citizenship.join(" , ")}
                      </p>
                    </div>

                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 hover:border-purple-500/30 transition-all">
                      <p className="text-slate-400 text-sm mb-1">Retired</p>
                      <p className="text-white font-medium">
                        {playerProfile.isRetired ? "Yes" : "No"}
                      </p>
                    </div>

                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 hover:border-purple-500/30 transition-all">
                      <p className="text-slate-400 text-sm mb-1">Other Positions</p>
                      <p className="text-white font-medium">
                        {playerProfile.position.other.join(" , ")}
                      </p>
                    </div>

                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 hover:border-purple-500/30 transition-all">
                      <p className="text-slate-400 text-sm mb-1">Foot</p>
                      <p className="text-white font-medium">
                        {playerProfile.foot.charAt(0).toUpperCase() +
                          playerProfile.foot.slice(1)}
                      </p>
                    </div>

                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 hover:border-purple-500/30 transition-all">
                      <p className="text-slate-400 text-sm mb-1">Club</p>
                      <p className="text-white font-medium">
                        {`Name : ${playerProfile.club.name}`}
                      </p>
                    </div>

                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 hover:border-purple-500/30 transition-all">
                      <p className="text-slate-400 text-sm mb-1">Joined</p>
                      <p className="text-white font-medium">
                        {playerProfile.club.joined}
                      </p>
                    </div>

                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4 hover:border-purple-500/30 transition-all">
                      <p className="text-slate-400 text-sm mb-1">Contract Expire</p>
                      <p className="text-white font-medium">
                        {playerProfile.club.contractExpires}
                      </p>
                    </div>

                  </div>
                </div>

                {/* RIGHT SECTION */}
                <div className="lg:w-[25%]">

                  <div className="
                    rounded-3xl
                    p-6
                    bg-gradient-to-br
                    from-emerald-500/10
                    to-cyan-500/10
                    border
                    border-emerald-500/20
                  ">
                    <h1 className="text-slate-400 uppercase tracking-widest text-sm">
                      Market Value
                    </h1>

                    <h1 className="text-5xl font-black text-emerald-400 mt-3">
                      €{(playerProfile.marketValue / 1000000).toFixed(1)}M
                    </h1>

                    <div className="mt-8">
                      <p className="text-slate-400 text-sm mb-2">
                        Outfitter
                      </p>

                      <h1 className="text-white text-xl font-semibold">
                        {playerProfile.outfitter}
                      </h1>
                    </div>
                  </div>

                  <div className="mt-6 bg-slate-800/50 border border-slate-700 rounded-3xl p-6">

                    <h3 className="text-xl font-bold text-white mb-5">
                      Social Media
                    </h3>

                    <div className="flex flex-wrap gap-3">
                      {playerProfile.socialMedia.map((link, index) => {
                        let icon = portfolioPic;

                        if (link.includes("instagram")) {
                          icon = instaPic;
                        } else if (
                          link.includes("x.com") ||
                          link.includes("twitter")
                        ) {
                          icon = xPic;
                        } else if (link.includes("youtube")) {
                          icon = youtubePic;
                        } else if (link.includes("facebook")) {
                          icon = facebookPic;
                        } else if (link.includes("tiktok")) {
                          icon = tiktokPic;
                        } else if (link.includes("twitch")) {
                          icon = twitchPic;
                        }

                        return (
                          <a
                            href={link}
                            key={index}
                            target="_blank"
                            rel="noreferrer"
                            className="
                              w-12
                              h-12
                              rounded-xl
                              bg-slate-700
                              border
                              border-slate-600
                              flex
                              items-center
                              justify-center
                              hover:bg-purple-600
                              hover:border-purple-400
                              hover:-translate-y-1
                              hover:scale-105
                              transition-all
                              duration-300
                            "
                          >
                            <img
                              className="h-6 w-6"
                              src={icon}
                              alt="social-icon"
                            />
                          </a>
                        );
                      })}
                    </div>

                  </div>

                </div>

              </div>
            </div>

          </div>

        </div>
      </div>
    </>
  )
}

export default PlayerCard;