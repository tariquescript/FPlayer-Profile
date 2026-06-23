import instaPic from '../assets/instagram.svg'
import xPic from '../assets/twitter.svg'
import youtubePic from '../assets/youtube.svg'
import facebookPic from '../assets/facebook.svg'
import portfolioPic from '../assets/portfolio.svg'

function PlayerCard({playerProfile}){




    return(
        <>
            <div className="mt-10 flex gap-5 items-center justify-center ">

                <div  >
                    <img src={playerProfile.imageUrl} alt="" />
                    <h1>Name : {playerProfile.name}</h1>
                    <h1>Club : {playerProfile.club.name}</h1>
                    <h1>Position : {playerProfile.position.main}</h1>     
                    <h2>Jersey No. {playerProfile.shirtNumber}</h2>
                </div>

                <div>
                    <h1>Full Name : {playerProfile.fullName || playerProfile.nameInHomeCountry} </h1>
                    <h1> Place of Birth : {playerProfile.placeOfBirth.city} , {playerProfile.placeOfBirth.country} </h1>
                    <h1> height : {playerProfile.height} </h1>
                    <h1> Citizenship : {playerProfile.citizenship.join(" , ")} </h1>
                    <h1> Retired : {playerProfile.isRetired ? "Yes" : "No"} </h1>
                    <h1>Other Positions : {playerProfile.position.other.join(" , ")} </h1>
                    Foot : {playerProfile.foot.charAt(0).toUpperCase() + playerProfile.foot.slice(1)}
                    <h1  > Club : {`Name : ${playerProfile.club.name}`} </h1>
                    <h1 className="" > {`Joined : ${playerProfile.club.joined}`} </h1>
                    <h1 className="" > {`Contract Expire : ${playerProfile.club.contractExpires}`} </h1>
                </div>

                <div>
                    <h1>
                        {`Market Value : ${playerProfile.marketValue}`}
                    </h1>
                    <h1>
                        {`Outfitter : ${playerProfile.outfitter}`}
                    </h1>

                    <div className='flex gap-3 mt-2' >
                        {playerProfile.socialMedia.map((link,index)=>{
                            let icon = portfolioPic;

                            if(link.includes("instagram")){
                                icon = instaPic;
                            }
                            else if (link.includes("x.com") || link.includes("twitter")){
                                icon = xPic;
                            } 
                            else if (link.includes("youtube")){
                                icon = youtubePic;
                            }
                            else if (link.includes("facebook")){
                                icon = facebookPic;
                            }

                            return(
                                <a href={link} key={index} target='_blank' rel='noreferrer' >
                                    <img className='h-7 w-7' src={icon} alt="social-icon" />
                                </a>
                            )

                        })}
                    </div>

                </div>

            </div>
            
        </>
        
    )
}


export default PlayerCard;