"use server";
import { getAuth } from "@/lib/auth/server";
export async function requestReset(_:string, _form:FormData):Promise<string> {
 const auth=getAuth(); const email=process.env.ADMIN_AUTH_EMAIL;
 if (!auth || !email) return "ระบบยังไม่พร้อมใช้งาน";
 const {error}=await auth.emailOtp.sendVerificationOtp({email,type:"forget-password"});
 if(error){console.error("Password OTP failed",{code:error.code,message:error.message});return "ส่งรหัสไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";}
 return "OTP_SENT";
}
export async function resetPassword(_:string, form:FormData):Promise<string> {
 const auth=getAuth(); const email=process.env.ADMIN_AUTH_EMAIL;
 const token=String(form.get("token")||"");const otp=String(form.get("otp")||"").trim();
 const password=String(form.get("password")||"");const confirm=String(form.get("confirm")||"");
 if(!auth||!email)return "ระบบยังไม่พร้อมใช้งาน";
 if(password.length<12||password.length>128||password!==confirm)return "รหัสผ่านต้องมีอย่างน้อย 12 ตัวอักษรและตรงกันทั้งสองช่อง";
 if(!token&&!/^\d{6}$/.test(otp))return "กรุณากรอกรหัส OTP 6 หลักจากอีเมล";
 const {error}=token?await auth.resetPassword({newPassword:password,token}):await auth.emailOtp.resetPassword({email,otp,password});
 return error?"ตั้งรหัสผ่านไม่สำเร็จ โปรดตรวจสอบ OTP หรือขอรหัสใหม่":"ตั้งรหัสผ่านเรียบร้อยแล้ว สามารถกลับไปเข้าสู่ระบบได้";
}
