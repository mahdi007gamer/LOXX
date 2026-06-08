import React, { useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";

export const BaleCallbackPage = () => {
 const [searchParams] = useSearchParams();
 const navigate = useNavigate();
 const { login } = useAuth();
 const token = searchParams.get("token");
 const hasRun = useRef(false);

 useEffect(() => {
 if (hasRun.current) return;
 hasRun.current = true;

 const verifyToken = async () => {
 if (!token) {
 toast.error("توکن نامعتبر است");
 navigate("/auth");
 return;
 }

 try {
 const response = await api.post("/auth/bale/callback", { token });
 login(response.data.token, response.data.user);
 toast.success("خوش آمدید! ورود با موفقیت انجام شد.");
 navigate("/dashboard");
 } catch (error: any) {
 toast.error("خطا در تایید هویت بله");
 navigate("/auth");
 }
 };

 verifyToken();
 }, [token, login, navigate]);

 return (
 <div className="flex min-h-screen items-center justify-center bg-[#050505]">
 <motion.div 
 initial={{ opacity: 0, scale: 0.9 }}
 animate={{ opacity: 1, scale: 1 }}
 className="text-center"
 >
 <Loader2 className="mx-auto h-12 w-12 animate-spin text-neon-blue mb-4" />
 <h2 className="text-xl font-black text-white uppercase ">
 در حال نبرد با موانع امنیتی...
 </h2>
 <p className="text-gray-500 mt-2 font-bold">لطفاً چند لحظه صبر کنید</p>
 </motion.div>
 </div>
 );
};
