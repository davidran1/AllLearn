"use client";
import React, { FC, useState } from "react";
import Heading from "./utils/Heading";
import Header from "./components/Header";

interface props {}

const Page: FC<props> = (props) => {
  const [open, setOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(0);

  return (
    <div>
      <Heading
        title="All-Learn"
        description="ברוכים הבאה לאול-ירן ת לסטודנטים שאוהבים אול-אין"
        keywords="מדעי המחשב , שיעורים פרטיים"
      />
      <Header
      open={open}
      setOpen={setOpen}
      activeItem={activeItem} />
    </div>
  );
};

export default Page;
