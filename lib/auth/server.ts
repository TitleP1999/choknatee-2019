import "server-only";
import { cookies } from "next/headers";
import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";
const cookieName="choknatee_admin";
export function getAuth(){
 const hash=process.env.ADMIN_PASSWORD_HASH, secret=process.env.NEON_AUTH_COOKIE_SECRET;
 if(!hash||!secret||secret.length<32)return null;
 const user={id:process.env.ADMIN_USER_ID||"admin",email:process.env.ADMIN_AUTH_EMAIL||""};
 const sign=(value:string)=>createHmac("sha256",secret).update(value).digest("hex");
 return {
  async getSession(){
   const value=(await cookies()).get(cookieName)?.value||"";
   const [expiry,signature]=value.split(".");
   const expected=sign(`${user.id}:${expiry}`);
   const valid=!!expiry&&Number(expiry)>Date.now()&&signature?.length===expected.length&&timingSafeEqual(Buffer.from(signature),Buffer.from(expected));
   return {data:valid?{user}:null,error:null};
  },
  signIn:{async email(input:{email:string;password:string}){
   const [salt,digest]=hash.split(":");
   if(!salt||!digest)return {data:null,error:"CONFIG_ERROR"};
   const actual=scryptSync(input.password,salt,64);const expected=Buffer.from(digest,"hex");
   const valid=input.email===user.email&&actual.length===expected.length&&timingSafeEqual(actual,expected);
   if(!valid){await new Promise(resolve=>setTimeout(resolve,1000));return {data:null,error:"INVALID_CREDENTIALS"};}
   const expiry=String(Date.now()+24*60*60*1000);
   (await cookies()).set(cookieName,`${expiry}.${sign(`${user.id}:${expiry}`)}`,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:86400});
   return {data:{user},error:null};
  }},
  async signOut(){(await cookies()).delete(cookieName);}
 };
}
