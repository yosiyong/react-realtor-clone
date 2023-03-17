import { db, auth } from "../firebase";
import { updateProfile } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FcHome } from "react-icons/fc";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import ListingItem from "../components/ListingItem";

export default function Profile() {
  const { t } = useTranslation();
  //認証済みデータ取得
  //const auth = getAuth();
  const navigate = useNavigate();
  const [changeDetail, setChangeDetail] = useState(false);
  const [listings, setListings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: auth.currentUser.displayName,
    email: auth.currentUser.email,
  });

  const {name, email} = formData;
  
  function onLogout() {
    auth.signOut();
    navigate("/");
  }

  //編集イベント
  function onChange(e) {
    setFormData((prevState)=>({
      ...prevState,
      [e.target.id]:e.target.value,
    }))
  }

  //登録ボタンクリック
  function onSubmitClick() {
    changeDetail && onSubmit();
    setChangeDetail((prevState) => !prevState);
  }

  //登録ボタン処理（名前とメールアドレス更新）
  async function onSubmit() {
    try {
      if(auth.currentUser.displayName !== name) {

        //firebase authの名前更新
        await updateProfile(auth.currentUser, {
          displayName: name,
        });

        //usersの名前更新
        const docRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(docRef, {
          name,
        });
        console.log('update success');
        toast.success(t("profile update"));
      }
    } catch (error) {
      console.log('ForgotPassword:',error);
      toast.error(t("profile error"));
    }
  }

  //auth.currentUser.uidが変更された場合、実施
  useEffect(()=>{
    //Listingsデータ取得
    async function fetchUserListings() {
      const listingRef = collection(db, "listings");
      const q = query(
        listingRef,
        where("userRef", "==", auth.currentUser.uid),
        orderBy("timestamp", "desc")
      );
      const querySnap = await getDocs(q);

      //取得データを配列(listings)に格納
      let listings = [];
      querySnap.forEach((doc) => {
        return listings.push({
          id: doc.id,
          data: doc.data(),
        });
      });
     
      //取得データ配列をuseStateに格納
      setListings(listings);

      setLoading(false);
    }
    fetchUserListings();
  },[auth.currentUser.uid]);

  //目録から指定物件情報を削除する。
  async function onDelete(listingID) {
    if (window.confirm(t("Are you sure you want to delete?"))) {
      await deleteDoc(doc(db, "listings", listingID));
      const updatedListings = listings.filter(
        (listing) => listing.id !== listingID
      );
      setListings(updatedListings);
      toast.success(t("Successfully deleted the listing"));
    }
  }

  //編集画面へ遷移
  function onEdit(listingID) {
    navigate(`/edit-listing/${listingID}`);
  }

  return (
    <>
    <section className="max-w-6xl mx-auto flex justify-center items-center flex-col">
      <h1 className="text-3xl text-center mt-6 font-bold">{t("My Profile")}</h1>
      <div className="w-full md:w-[50%] mt-6 px-3">
        <form>

          {/* name input */}
          <input type="text" id="name" onChange={onChange} value={name} disabled={!changeDetail} 
          className={`mb-6 w-full px-4 py-2 text-xl text-gray-700 bg-white border border-gray-300 rounded transition ease-in-out ${
            changeDetail && "bg-red-200 focus:bg-red-200"
          }`} />
        
          {/* email input */}
          <input type="email" id="email" value={email} disabled 
          className="mb-6 w-full px-4 py-2 text-xl text-gray-700 bg-white border border-gray-300 rounded transition ease-in-out" />
        
          <div className="flex justify-between whitespace-nowrap text-sm sm:text-lg mb-6">
            <p className="flex items-center">{t("change name")}
            <span onClick={onSubmitClick} 
            className="text-red-600 hover:text-red-700 transition ease-in-out duration-200 ml-1 cursor-pointer">
              {changeDetail ? t("apply change") : t("edit")}
              </span></p>
            <p onClick={onLogout} className="text-blue-600 hover:text-blue-800 transition duration-200 ease-in-out cursor-pointer">{t("Sign out")}</p>
          </div>
        </form>

        <button type="submit" className="w-full bg-blue-600 text-white uppercase px-7 py-3 text-sm font-medium rounded shadow-md hover:bg-blue-700 transition duration-150 ease-in-out hover:shadow-lg active:bg-blue-800">
          <Link to="/create-listing" className="flex justify-center items-center">
            <FcHome className="mr-2 text-3xl bg-red-200 rounded-full p-1 border-2"/>{t("Sell or rent your home")}
          </Link>
        </button>
      </div>
    </section>
    
    <div className="max-w-6xl px-3 mt-6 mx-auto">
        {!loading && listings.length > 0 && (
          <>
            <h2 className="text-2xl text-center font-semibold mb-6">
            {t("My Listings")}
            </h2>
            <ul className="sm:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {listings.map((listing) => (
                <ListingItem
                  key={listing.id}
                  id={listing.id}
                  listing={listing.data}
                  onDelete={() => onDelete(listing.id)}
                  onEdit={() => onEdit(listing.id)}
                />
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  )
}
