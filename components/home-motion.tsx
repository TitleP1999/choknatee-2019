"use client";
import { useEffect } from "react";
export function HomeMotion(){
 useEffect(()=>{
  const root=document.querySelector<HTMLElement>(".site-home");
  if(!root||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const elements=Array.from(root.querySelectorAll<HTMLElement>(".intro>div,.fleet-heading,.fleet-card,.gallery>h2,.gallery-card,.process>div,.contact-grid>div"));
  const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("revealed");observer.unobserve(entry.target)}})},{threshold:.08});
  elements.forEach((element,index)=>{element.classList.add("reveal");element.style.setProperty("--reveal-delay",`${(index%3)*70}ms`);observer.observe(element)});
  const progress=root.querySelector<HTMLElement>(".scroll-progress");let frame=0;
  const update=()=>{frame=0;const height=document.documentElement.scrollHeight-window.innerHeight;progress?.style.setProperty("--progress",String(height>0?window.scrollY/height:0))};
  const onScroll=()=>{if(!frame)frame=requestAnimationFrame(update)};
  window.addEventListener("scroll",onScroll,{passive:true});update();
  return()=>{observer.disconnect();window.removeEventListener("scroll",onScroll);cancelAnimationFrame(frame);elements.forEach(element=>element.classList.remove("reveal","revealed"))};
 },[]);
 return <div className="scroll-progress" aria-hidden="true"/>;
}
