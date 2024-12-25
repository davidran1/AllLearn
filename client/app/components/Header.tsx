"use client";
import React, { FC, useState } from "react";

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  activeItem: number;
};

const Header: FC<Props> = (props) => {
  const [active, setActive] = useState(false);
  const [openSideBar, setOpenSideBar] = useState(false);

  return <div className="w-full relative">
    <div className={`${active? "dark:bg-opacity-50 dark:bg-gradient-to-bite dark:bg-gray-900 dark:bg-opacity-50 bg-opacity-50 bg-gray-100"} w-full h-16 flex items-center justify-between`}>
  </div>;
};

export default Header;
