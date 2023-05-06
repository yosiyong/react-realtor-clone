import { useEffect, useState } from 'react'
import { useParams } from 'react-router';
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
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
import { useTranslation } from "react-i18next";
import Contact from '../components/Contact';

export default function Listing() {
    
    const params = useParams();
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [shareLinkCopied, setShareLinkCopied] = useState(false);
    const [contactLandlord, setContactLandlord] = useState(false);
    const { t } = useTranslation();

    SwiperCore.use([Autoplay, Navigation, Pagination]);

    useEffect(()=>{
        //setLoading(true);
        async function fetchListing() {
            const docRef = doc(db, "listings", params.listingId );
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                //console.log(params.listingId,docSnap.data());
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

        <div onClick={()=>{
          navigator.clipboard.writeText(window.location.href);
          setShareLinkCopied(true);
          setTimeout(()=>{
            setShareLinkCopied(false);
          }, 2000);
        }} className='fixed top-[13%] right-[3%] z-10 bg-white cursor-pointer border-2 border-gray-400 rounded-full w-12 h-12 flex justify-center items-center'>
          <FaShare className='text-lg text-slate-500'/>
        </div>
        {shareLinkCopied && (
          <p className='fixed top-[23%] right-[5%] font-semibold bg-white border-2 border-gray-400 rounded-md z-10 p-2'>{t('Link Copied')}</p>
        )}

        <div className="m-4 flex flex-col md:flex-row max-w-6xl lg:mx-auto p-4 rounded-lg shadow-lg bg-white lg:space-x-5">
          <div className="w-full">

            <p className="text-2xl font-bold mb-3 text-blue-900">
              {listing.name} - {t("$")}{" "}
              {listing.offer
                ? listing.discountedPrice
                    .toString()
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                : listing.regularPrice
                    .toString()
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              {listing.type === "rent" ? t(" / month") : ""}
            </p>
            
            <p className="flex items-center mt-6 mb-3 font-semibold">
              <FaMapMarkerAlt className="text-green-700 mr-1"/>{listing.address}
            </p>

            <div className="flex justify-start items-center space-x-4 w-[75%]">
              <p className="bg-red-800 w-full max-w-[200px] rounded-md p-1 text-white text-center font-semibold shadow-md">
                {listing.type === "rent" ? t("Rent") : t("Sale")}
              </p>
              {listing.offer && (
                <p className="w-full max-w-[200px] bg-green-800 rounded-md p-1 text-white text-center font-semibold shadow-md">
                  {t("$")}{(+listing.regularPrice - +listing.discountedPrice).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} {t("discount")}
                </p>
              )}
            </div>

            <p className="mt-3 mb-3">
              <span className="font-semibold">{t("Description")} - </span>
              {listing.description}
            </p>

            <ul className="flex items-center space-x-2 sm:space-x-9 text-sm font-semibold mb-6">
              <li className="flex items-center whitespace-nowrap">
                <FaBed className="text-lg mr-1" />
                {+listing.bedrooms > 1 ? `${listing.bedrooms} ${t("Beds")}` : t("1 Bed")}
              </li>
              <li className="flex items-center whitespace-nowrap">
                <FaBath className="text-lg mr-1" />
                {+listing.bathrooms > 1 ? `${listing.bathrooms} ${t("Baths")}` : t("1 Bath")}
              </li>
              <li className="flex items-center whitespace-nowrap">
                <FaParking className="text-lg mr-1" />
                {listing.parking ? t("Parking spot") : t("No parking")}
              </li>
              <li className="flex items-center whitespace-nowrap">
                <FaChair className="text-lg mr-1" />
                {listing.furnished ? t("Furnished") : t("Not furnished")}
              </li>
            </ul>
            {/* ログイン中のユーザーが掲示物件のオーナーではない場合、ボタン表示 */}
            {listing.userRef !== auth.currentUser?.uid && !contactLandlord && (
              <div className="mt-6">
                <button onClick={()=>setContactLandlord(true)} className="px-7 py-3 bg-blue-600 text-white font-medium text-sm uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg w-full text-center transition duration-150 ease-in-out ">{t('Contact landlord')}</button>
              </div>
            )}

            {contactLandlord && (
              <Contact userRef={listing.userRef} listing={listing} />
            )}
           
          </div>
          <div className="bg-blue-300 w-full h-[200px] lg-[400px] z-10 overflow-x-hidden"></div>
        </div>
    </main>
  )
}
