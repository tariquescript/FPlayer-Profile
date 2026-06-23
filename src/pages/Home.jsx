// import myLogo from '../../assets/myLogo.png'
import { useState, useEffect } from "react";
import Card from "../components/Card";

function Home() {
  const [searchInput, setSearchInput] = useState("");
  const [searchButtonInput, setSearchButtonInput] = useState("");
  const [getPlayer, setGetPlayer] = useState([]); // fetching the data from useeffect api
  const [loading, setLoading] = useState(false);


  
  const getSearch = () => {
    ;
    setSearchButtonInput(searchInput);
  };

  useEffect(() => {
    if (searchButtonInput === "") return ;
    setLoading(true);
    

    fetch(`https://transfermarkt-api-82dl.onrender.com/players/search/${searchButtonInput}`)
      .then((res) => res.json())
      .then((data) =>{
         setGetPlayer(data.results);
      } ).finally(()=>{
        setLoading(false);
      })
  }, [searchButtonInput]);

  const getInput = (event) => {
    setSearchInput(event.target.value);
  };

  return (
    <>
      <div>
        <input
          onChange={getInput}
          value={searchInput}
          placeholder="Search Player"
          type="text"
          className="w-[60%] mx-auto flex justify-center border-b-1 focus:border-b-2   focus:shadow-xl border-purple-800 mt-12 focus:outline-none text-center p-2"
        />

        <div className="mt-4">
          <button
            onClick={getSearch}
            disabled = {loading}
            type="button"
            class=" mx-auto block text-heading bg-gradient-to-r from-teal-200 to-lime-200 hover:bg-gradient-to-l hover:from-teal-200 hover:to-lime-200 focus:ring-4 focus:outline-none focus:ring-lime-200 dark:focus:ring-teal-700 font-medium rounded-2xl text-md px-4 py-2.5 text-center leading-5"
          >
            {loading ? "Searching..." : "Search Player"}
          </button>
        </div>
      </div>
      <Card searchButtonInput={searchButtonInput} getPlayer={getPlayer} />
    </>
  );
}

export default Home;
