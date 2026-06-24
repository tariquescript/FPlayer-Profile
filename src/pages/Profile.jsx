import { useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import PlayerCard from '../components/PlayerCard'

function Profile(){

    const {state} = useLocation();
    const {id} = useParams();
    // console.log(state.player);
    const  [playerProfile, setPlayerprofile] = useState(state?.player || null)
    console.log(playerProfile)


    return(
        <>
            <div  >
                <PlayerCard playerProfile={playerProfile} />
            </div>
        </>
    )
}

export default Profile;