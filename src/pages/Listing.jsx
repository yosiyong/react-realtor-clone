import { useEffect, useState } from 'react'
import { useParams } from 'react-router';
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import Spinner from "../components/Spinner";
import { Swiper, SwiperSlide } from 'swiper/react';
import SwiperCore, {EffectFade, Autoplay, Navigation, Pagination} from "swiper";
import "swiper/css/bundle";
import {
    FaShare,
    FaMapMarkerAlt,
    FaBed,
    FaBath,
    FaParking,
    FaChair,
  } from "react-icons/fa";


export default function Listing() {
    
    const params = useParams();
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [shareLinkCopied, setShareLinkCopied] = useState(false);
    const [contactLandlord, setContactLandlord] = useState(false);
    SwiperCore.use([Autoplay, Navigation, Pagination]);

    useEffect(()=>{
        //setLoading(true);
        async function fetchListing() {
            const docRef = doc(db, "listings", params.listingId );
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                console.log(params.listingId,docSnap.data());
                setListing(docSnap.data());
                setLoading(false);
            }
        }
        fetchListing();
        
    },[params.listingId]);

  if (loading) {
    return <Spinner />;
  }

  return (
    <main>
        <Swiper
        slidesPerView={1}
        navigation
        pagination={{ type: "progressbar" }}
        effect="fade"
        modules={[EffectFade]}
        autoplay={{ delay: 3000 }}
        >
        {listing.imgUrls.map((url, index) => (
            <SwiperSlide key={index}>
            <div
                className="relative w-full overflow-hidden h-[300px]"
                style={{
                background: `url(${listing.imgUrls[index]}) center no-repeat`,
                backgroundSize: "cover",
                }}
            ></div>
            </SwiperSlide>
        ))}
        </Swiper>
    </main>
  )
}
