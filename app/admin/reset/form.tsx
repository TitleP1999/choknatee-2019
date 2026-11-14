"use client";
import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card,CardContent } from "@/components/ui/card";
import { requestReset,resetPassword } from "./actions";
export function ResetForm({token}:{token:string}) {
 const [sent,sendAction,sending]=useActionState(requestReset,"");
 const [message,resetAction,resetting]=useActionState(resetPassword,"");
 const showFields=!!token||sent==="OTP_SENT";
 return <main className="admin-shell admin-login"><Card><CardContent><h1>ตั้งรหัสผ่านผู้ดูแล</h1><p>{showFields?"กรอกรหัสจากอีเมลและตั้งรหัสผ่านใหม่อย่างน้อย 12 ตัวอักษร":"ส่งรหัส OTP ไปยังอีเมลผู้ดูแลที่ลงทะเบียนไว้"}</p>{!token&&<form action={sendAction}>{sent&&sent!=="OTP_SENT"&&<p role="alert">{sent}</p>}{sent==="OTP_SENT"&&<p role="status">ส่งรหัสแล้ว กรุณาตรวจสอบอีเมล รวมถึงโฟลเดอร์ Spam</p>}<Button type="submit" disabled={sending}>{sending?"กำลังส่งรหัส...":showFields?"ส่งรหัส OTP ใหม่":"ส่งรหัส OTP ทางอีเมล"}</Button></form>}{showFields&&<form action={resetAction}>{token?<input type="hidden" name="token" value={token}/>:<label className="admin-field"><span>รหัส OTP จากอีเมล</span><input name="otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required/></label>}<label className="admin-field"><span>รหัสผ่านใหม่</span><input name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={128}/></label><label className="admin-field"><span>ยืนยันรหัสผ่าน</span><input name="confirm" type="password" autoComplete="new-password" required minLength={12} maxLength={128}/></label>{message&&<p role="status">{message}</p>}<Button type="submit" disabled={resetting}>{resetting?"กำลังบันทึก...":"ตั้งรหัสผ่าน"}</Button></form>}<Link href="/admin">กลับไปเข้าสู่ระบบ</Link></CardContent></Card></main>;
}
