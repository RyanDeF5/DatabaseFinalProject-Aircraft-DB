import React, { useState } from "react";

interface Props {
  tableName: string;
  onOk: (data: any) => void;
  onCancel: () => void; 
}

export default function DeleteRowPopup({ tableName, onOk, onCancel }: Props) {
  const [value, setValue] = useState("");

  const handleOk = () => {
      onOk(value);
    }

  return (
    <div className="relative">
      <div className="opacity-80 absolute bottom-20 left-60 w-100 h-60 bg-black border border-white ">
        <div className="opacity-100 grid grid-rows-auto gap-y-5 place-items-center">
          <h1 className={`text-[27px]`}>
            Enter Row ID to Delete
          </h1>
          <h1 className={`text-[20px]`}> From {tableName}: </h1>
          <input onChange={(e) => setValue(e.target.value)} className="h-8 w-30 bg-black border border-white" /> 
          <div>
            <button onClick={onCancel} className="mr-2.5 row-start-4 h-8 w-35 border border-white bg-black text-white transition-opacity duration-200 hover:bg-red-500">Cancel</button> 
            <button onClick={handleOk} className="ml-2.5 h-8 w-35 border border-white text-white transition-opacity duration-200 hover:bg-green-500">Submit</button>
          </div>
        </div>
      </div>
    </div>
  );
}