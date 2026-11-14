"use server";
import { neon } from "@neondatabase/serverless";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getAuth } from "@/lib/auth/server";
import { defaultContent } from "@/lib/default-content";

export async function uploadAdminImage(formData: FormData): Promise<{ok: boolean; message: string; path?: string}> {
 const auth = getAuth();
 if (!auth || !process.env.ADMIN_USER_ID) return {ok:false,message:"ยังไม่ได้ตั้งค่าระบบผู้ดูแล"};
 const {data:session,error} = await auth.getSession();
 if (error || !session?.user || session.user.id !== process.env.ADMIN_USER_ID) return {ok:false,message:"กรุณาเข้าสู่ระบบอีกครั้ง"};
 const file = formData.get("image");
 if (!(file instanceof File) || !file.size) return {ok:false,message:"กรุณาเลือกรูปภาพ"};
 const extensions: Record<string,string> = {"image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/avif":"avif"};
 const ext = extensions[file.type];
 if (!ext) return {ok:false,message:"รองรับไฟล์ JPG, PNG, WebP และ AVIF เท่านั้น"};
 if (file.size > 8 * 1024 * 1024) return {ok:false,message:"ไฟล์ต้องมีขนาดไม่เกิน 8 MB"};
 const bytes = Buffer.from(await file.arrayBuffer());
 const signature = ext === "jpg" ? bytes.subarray(0,3).equals(Buffer.from([0xff,0xd8,0xff])) : ext === "png" ? bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : ext === "webp" ? bytes.toString("ascii",8,12) === "WEBP" : bytes.toString("ascii",4,12).includes("ftypavif");
 if (!signature) return {ok:false,message:"ไฟล์รูปภาพไม่ถูกต้อง"};
 const filename = `${Date.now()}-${randomUUID()}.${ext}`;
 const directory = path.join(process.cwd(),"public","uploads");
 await mkdir(directory,{recursive:true});
 await writeFile(path.join(directory,filename),bytes,{flag:"wx"});
 return {ok:true,message:"อัปโหลดรูปแล้ว",path:`/uploads/${filename}`};
}
function validShape(value: unknown, sample: unknown, key = ""): boolean {
 if (typeof sample === "string") {
  if (typeof value !== "string" || value.length > 3000) return false;
  if (["image", "src", "logo"].includes(key) && value && !/^\/(?!\/)[^\\]*$/.test(value) && !/^https:\/\//i.test(value)) return false;
  return true;
 }
 if (Array.isArray(sample)) return Array.isArray(value) && value.length <= 100 && value.every(v => validShape(v, sample[0], key));
 if (sample && typeof sample === "object") {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>, s = sample as Record<string, unknown>;
  return Object.keys(v).every(k => k in s) && Object.keys(s).every(k => validShape(v[k], s[k], k));
 }
 return false;
}
export async function login(_: string, form: FormData): Promise<string> {
 const auth = getAuth(); const username = process.env.ADMIN_USERNAME; const email = process.env.ADMIN_AUTH_EMAIL;
 if (!auth || !process.env.ADMIN_USER_ID || !username || !email) return "ยังไม่ได้ตั้งค่าบัญชีผู้ดูแล";
 if (String(form.get("username") || "").trim().toLowerCase() !== username.trim().toLowerCase()) return "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง";
 const {data, error} = await auth.signIn.email({ email, password:String(form.get("password") || "") });
 if (error || !data?.user) return "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง";
 if (data.user.id !== process.env.ADMIN_USER_ID) { await auth.signOut(); return "บัญชีนี้ไม่มีสิทธิ์ดูแลเว็บไซต์"; }
 redirect("/admin");
}
export async function logout() { const auth = getAuth(); if (auth) await auth.signOut(); redirect("/admin"); }
export async function saveContent(content: unknown): Promise<{ok: boolean; message: string}> {
 const auth = getAuth(); if (!auth || !process.env.ADMIN_USER_ID || !process.env.DATABASE_URL) return {ok:false,message:"ยังไม่ได้ตั้งค่าระบบ"};
 const {data:session,error} = await auth.getSession();
 if (error || !session?.user || session.user.id !== process.env.ADMIN_USER_ID) return {ok:false,message:"กรุณาเข้าสู่ระบบอีกครั้ง"};
 if (JSON.stringify(content).length > 250000 || !validShape(content, defaultContent)) return {ok:false,message:"ข้อมูลไม่ถูกต้อง โปรดตรวจสอบช่องข้อมูลและลิงก์รูปภาพ"};
 try { const sql=neon(process.env.DATABASE_URL); await sql`INSERT INTO site_content (id,content,updated_at) VALUES (1, ${JSON.stringify(content)}::jsonb, now()) ON CONFLICT (id) DO UPDATE SET content=EXCLUDED.content, updated_at=now()`; }
 catch { return {ok:false,message:"บันทึกไม่สำเร็จ โปรดตรวจสอบการเชื่อมต่อฐานข้อมูล"}; }
 revalidatePath("/"); revalidatePath("/admin"); return {ok:true,message:"บันทึกเรียบร้อยแล้ว"};
}
