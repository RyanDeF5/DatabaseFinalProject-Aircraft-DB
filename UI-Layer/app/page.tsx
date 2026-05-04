"use client";
import { Roboto_Mono } from 'next/font/google';
const robotoMono = Roboto_Mono({ subsets: ['latin'], weight: ['400', '700']});
import { useState, useEffect } from 'react';
import { MainPage } from './mainPage';
import "./globals.css";

export default function Home() {
  return (
    <MainPage/>
  );
}
