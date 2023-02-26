import { useState } from "react";
import Spinner from "../components/Spinner";
import { toast } from "react-toastify";
import { db, auth, storage } from "../firebase";
//import { getAuth } from "firebase/auth";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

import { v4 as uuidv4 } from "uuid";
//import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function CreateListing() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  //const auth = getAuth();
  const [geolocationEnabled, setGeolocationEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: "rent",
    name: "",
    bedrooms: 1,
    bathrooms: 1,
    parking: false,
    furnished: false,
    address: "",
    description: "",
    offer: false,
    regularPrice: 0,
    discountedPrice: 0,
    latitude: 0,
    longitude: 0,
    images: {},
  });
  
  const {
    type,
    name,
    bedrooms,
    bathrooms,
    parking,
    address,
    furnished,
    description,
    offer,
    regularPrice,
    discountedPrice,
    latitude,
    longitude,
    images,
  } = formData;

  function onChange(e) {
    let boolean = null;
    if (e.target.value === "true") {
      boolean = true;
    }
    if (e.target.value === "false") {
      boolean = false;
    }
    // Files
    if (e.target.files) {
      setFormData((prevState) => ({
        ...prevState,
        images: e.target.files,
      }));
    }
    // Text/Boolean/Number
    if (!e.target.files) {
      setFormData((prevState) => ({
        ...prevState,
        [e.target.id]: boolean ?? e.target.value,
      }));
    }
  }
  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);

    //割引価格 >= 通常価格の場合、エラー
    if (+discountedPrice >= +regularPrice) {
      setLoading(false);
      toast.error(t('Discounted price needs to be less than regular price'));
      return;
    }

    //指定したイメージファイルが6個を超えた場合、エラー
    if (images.length > 6) {
      setLoading(false);
      toast.error(t('maximum 6 images are allowed'));
      return;
    }
    let geolocation = {};
    let location;
    if (geolocationEnabled) {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${import.meta.env.VITE_GEOCODE_API_KEY}`
      );
      const data = await response.json();
      console.log("address response:",data);

      //経緯度取得
      //data.results[0]がtrueの場合、geometry.location.latを取得、nullの場合、0をセット
      geolocation.lat = data.results[0]?.geometry.location.lat ?? 0;
      geolocation.lng = data.results[0]?.geometry.location.lng ?? 0;

      //経緯度が取得できなかった場合、存在しない住所とみなしてエラー
      location = data.status === "ZERO_RESULTS" && undefined;
      if (location === undefined) {
        setLoading(false);
        toast.error(t('please enter a correct address'));
        return;
      }
    } else {
      geolocation.lat = latitude;
      geolocation.lng = longitude;
    }

    //非同期処理でイメージアップロード
    async function storeImage(image) {
      return new Promise((resolve, reject) => {
        //参照URL:https://firebase.google.com/docs/storage/web/upload-files?hl=ja#web-version-9_7
        //const storage = getStorage();
        const filename = `${auth.currentUser.uid}-${image.name}-${uuidv4()}`;
        const storageRef = ref(storage, filename);
        const uploadTask = uploadBytesResumable(storageRef, image);
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            // Observe state change events such as progress, pause, and resume
            // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log("Upload is " + progress + "% done");
            
            switch (snapshot.state) {
              case "paused":
                console.log("Upload is paused");
                break;
              case "running":
                console.log("Upload is running");
                break;
            }
          },
          (error) => {
            // Handle unsuccessful uploads
            reject(error);
          },
          () => {
            // 処理成功：アップロードしたイメージファイルの保存先URLを返す
            // For instance, get the download URL: https://firebasestorage.googleapis.com/...
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
              resolve(downloadURL);
            });
          }
        );
      });
    }

    //イメージアップロード：保存先URL取得
    const imgUrls = await Promise.all(
      //非同期処理でイメージアップロード
      [...images].map((image) => storeImage(image))
    ).catch((error) => {
      console.log("image upload error:",error)
      setLoading(false);
      toast.error("Images not uploaded");
      return;
    });
    console.log('Uploaded image Url:',imgUrls);

    // const formDataCopy = {
    //   ...formData,
    //   imgUrls,
    //   geolocation,
    //   timestamp: serverTimestamp(),
    //   userRef: auth.currentUser.uid,
    // };
    // delete formDataCopy.images;
    // !formDataCopy.offer && delete formDataCopy.discountedPrice;
    // delete formDataCopy.latitude;
    // delete formDataCopy.longitude;
    // const docRef = await addDoc(collection(db, "listings"), formDataCopy);
    // setLoading(false);
    // toast.success("Listing created");
    // navigate(`/category/${formDataCopy.type}/${docRef.id}`);
  }

  if (loading) {
    return <Spinner />;
  }

return (
  <main className="max-w-md px-2 mx-auto">
    <h1 className="text-3xl text-center mt-6 font-bold">{t('Create a Listing')}</h1>
    <form onSubmit={onSubmit}>
      {/* 売る・賃貸 */}
      <p className="text-lg mt-6 font-semibold">{t('Sell')} / {t('Rent')}</p>
      <div className="flex">
        <button type="button" id="type" value="sell" onClick={onChange} 
          className={`mr-3 px-7 py-3 font-medium text-sm uppercase shadow-md rounded hover:shadow-lg focus:shadow-l active:shadow-lg transition duration-150 ease-in-out w-full ${
            type === "rent" ? "bg-white text-black" : "bg-slate-600 text-white"
          }`}>
          {t('Sell')}
        </button>
        <button type="button" id="type" value="rent" onClick={onChange} 
          className={`ml-3 px-7 py-3 font-medium text-sm uppercase shadow-md rounded hover:shadow-lg focus:shadow-l active:shadow-lg transition duration-150 ease-in-out w-full ${
            type === "sell" ? "bg-white text-black" : "bg-slate-600 text-white"
          }`}>
          {t('Rent')}
        </button>
      </div>

      {/* 物件名 */}
      <p className="text-lg mt-6 font-semibold">{t('creatoffer.Name')}</p>
      <input type="text" id="name" value={name} onChange={onChange} 
      placeholder={t('creatoffer.Name')} maxLength="32" minLength={i18n.resolvedLanguage === "en" ? "10" : "2"} required 
      className="w-full px-4 py-2 text-xl text-gray-700 bg-white border border-gray-300 rounded transition duration-150 ease-in-out focus:text-gray-700 focus:bg-white focus:border-slate-600" />

      {/* 部屋数 */}
      <div className="flex space-x-6 mb-6">
        <div>
          <p className="text-lg mt-6 font-semibold">{t('Beds')}</p>
          <input type="number" id="bedrooms" value={bedrooms} onChange={onChange} 
            min="1" max="100" required 
            className="w-full px-4 py-2 text-xl text-gray-700 bg-white border border-gray-300 rounded transition duration-150 ease-in-out focus:text-gray-700 focus:bg-white focus:border-slate-600 text-center" />
        </div>
        <div>
          <p className="text-lg mt-6 font-semibold">{t('Baths')}</p>
          <input type="number" id="bathrooms" value={bathrooms} onChange={onChange} 
            min="0" max="50" required 
            className="w-full px-4 py-2 text-xl text-gray-700 bg-white border border-gray-300 rounded transition duration-150 ease-in-out focus:text-gray-700 focus:bg-white focus:border-slate-600 text-center" />
        </div>
      </div>

      {/* 駐車場 */}
      <p className="text-lg mt-6 font-semibold">{t('Parking spot')}</p>
      <div className="flex">
        <button type="button" id="parking" value={true} onClick={onChange} 
          className={`mr-3 px-7 py-3 font-medium text-sm uppercase shadow-md rounded hover:shadow-lg focus:shadow-l active:shadow-lg transition duration-150 ease-in-out w-full ${
            !parking ? "bg-white text-black" : "bg-slate-600 text-white"
          }`}>
          {t('creatoffer.Yes')}
        </button>
        <button type="button" id="parking" value={false} onClick={onChange} 
          className={`ml-3 px-7 py-3 font-medium text-sm uppercase shadow-md rounded hover:shadow-lg focus:shadow-l active:shadow-lg transition duration-150 ease-in-out w-full ${
            parking ? "bg-white text-black" : "bg-slate-600 text-white"
          }`}>
          {t('creatoffer.No')}
        </button>
      </div>

      {/* 家具 */}
      <p className="text-lg mt-6 font-semibold">{t('Furnished')}</p>
      <div className="flex">
        <button type="button" id="furnished" value={true} onClick={onChange} 
          className={`mr-3 px-7 py-3 font-medium text-sm uppercase shadow-md rounded hover:shadow-lg focus:shadow-l active:shadow-lg transition duration-150 ease-in-out w-full ${
            !furnished ? "bg-white text-black" : "bg-slate-600 text-white"
          }`}>
          {t('creatoffer.Yes')}
        </button>
        <button type="button" id="furnished" value={false} onClick={onChange} 
          className={`ml-3 px-7 py-3 font-medium text-sm uppercase shadow-md rounded hover:shadow-lg focus:shadow-l active:shadow-lg transition duration-150 ease-in-out w-full ${
            furnished ? "bg-white text-black" : "bg-slate-600 text-white"
          }`}>
          {t('creatoffer.No')}
        </button>
      </div>

      {/* 住所 */}
      <p className="text-lg mt-6 font-semibold">{t('Address')}</p>
      <textarea type="text" id="address" value={address} onChange={onChange} 
        placeholder={t('Address')} required 
        className="w-full px-4 py-2 text-xl text-gray-700 bg-white border border-gray-300 rounded transition duration-150 ease-in-out focus:text-gray-700 focus:bg-white focus:border-slate-600" />

      {/* 経度・緯度 */}
      {!geolocationEnabled && (
        <div className="mt-6 flex space-x-6 justify-start">
          <div className="">
            <p className="text-lg font-semibold">{t('Latitude')}</p>
            <input type="number" id="latitude" value={latitude} onChange={onChange} 
            required min="-90" max="90" 
            className="px-4 py-2 text-xl text-gray-700 bg-white border border-gray-300 rounded transition duration-150 ease-in-out focus:text-gray-700 focus:bg-white focus:border-slate-600 text-center"/>
          </div>
          <div className="">
            <p className="text-lg font-semibold">{t('Longitude')}</p>
            <input type="number" id="longitude" value={longitude} onChange={onChange} 
            required min="-180" max="180" 
            className="px-4 py-2 text-xl text-gray-700 bg-white border border-gray-300 rounded transition duration-150 ease-in-out focus:text-gray-700 focus:bg-white focus:border-slate-600 text-center"/>
          </div>
        </div>
      )}

      {/* 説明 */}
      <p className="text-lg mt-6 font-semibold">{t('Description')}</p>
      <textarea type="text" id="description" value={description} onChange={onChange} 
        placeholder={t('Description')} required 
        className="w-full px-4 py-2 text-xl text-gray-700 bg-white border border-gray-300 rounded transition duration-150 ease-in-out focus:text-gray-700 focus:bg-white focus:border-slate-600" />

      {/* 公開 */}
      <p className="text-lg mt-6 font-semibold">{t('Offer')}</p>
      <div className="flex">
        <button type="button" id="offer" value={true} onClick={onChange} 
          className={`mr-3 px-7 py-3 font-medium text-sm uppercase shadow-md rounded hover:shadow-lg focus:shadow-l active:shadow-lg transition duration-150 ease-in-out w-full ${
            !offer ? "bg-white text-black" : "bg-slate-600 text-white"
          }`}>
          {t('Yes')}
        </button>
        <button type="button" id="offer" value={false} onClick={onChange} 
          className={`ml-3 px-7 py-3 font-medium text-sm uppercase shadow-md rounded hover:shadow-lg focus:shadow-l active:shadow-lg transition duration-150 ease-in-out w-full ${
            offer ? "bg-white text-black" : "bg-slate-600 text-white"
          }`}>
          {t('No')}
        </button>
      </div>

      {/* 通常価格 */}
      <div className="mb-6">
        <p className="text-lg mt-6 font-semibold">{t('Regular price')}</p>
        <div className="flex w-full justify-center items-center space-x-6">
          <input type="number" id="regularPrice" value={regularPrice} onChange={onChange} 
            min="50" max="1000000000" required={offer} 
            className="w-full px-4 py-2 text-xl text-gray-700 bg-white border border-gray-300 rounded transition duration-150 ease-in-out focus:text-gray-700 focus:bg-white focus:border-slate-600 text-center" />

          {type === "rent" && (
            <div className="">
              <p className="text-md w-full whitespace-nowrap">{t('$ / Month')}</p>
            </div>
          )}
        </div>
      </div>

      {/* 値引き価格 */}
      {offer && (
        <div className="mb-6">
          <p className="text-lg mt-6 font-semibold">{t('Discount price')}</p>
          <div className="flex w-full justify-center items-center space-x-6">
            <input type="number" id="discountPrice" value={discountPrice} onChange={onChange} 
              min="50" max="1000000000" required={offer} 
              className="w-full px-4 py-2 text-xl text-gray-700 bg-white border border-gray-300 rounded transition duration-150 ease-in-out focus:text-gray-700 focus:bg-white focus:border-slate-600 text-center" />

            {type === "rent" && (
              <div className="">
                <p className="text-md w-full whitespace-nowrap">{t('$ / Month')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* イメージ */}
      <div className="mb-6">
        <p className="text-lg mt-6 font-semibold">{t('Images')}</p>
        <p>{t('The first image will be the cover (max 6)')}</p>
        <div className="flex w-full justify-center items-center space-x-6">
          <input type="file" id="images" onChange={onChange} 
            accept=".jpg,.png,.jpeg" multiple required 
            className="w-full px-4 py-2 text-xl text-gray-700 bg-white border border-gray-300 rounded transition duration-150 ease-in-out focus:text-gray-700 focus:bg-white focus:border-slate-600" />
        </div>
      </div>

      <button type="submit" className="mb-6 w-full px-7 py-3 bg-blue-600 text-white font-medium text-sm uppercase rounded shadow-md hover:bg-blue-700 focus:shadow-lg active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out">
        {t('Create Listing')}</button>
    </form>
  </main>
  );
}
