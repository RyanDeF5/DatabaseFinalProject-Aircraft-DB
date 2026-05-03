import React, { useState } from "react";

interface Props {
  tableName: string;
  numOfFields: number;
  onOk: (data: Record<string, string>) => void;
  onCancel: () => void; 
}

export default function AddRowPopup({ tableName, numOfFields, onOk, onCancel }: Props) {
  const [values, setValues] = useState<string[]>(Array(numOfFields).fill("")); 

  const handleChange = (index: number, value: string) => {
    const newValues = [...values];
    newValues[index] = value;
    setValues(newValues); 
  };

  const handleOk = () => {
      const data = values.reduce((acc, val, index) => {
      acc[`field${index}`] = val; 
      return acc;
      }, {} as Record<string, string>);
      onOk(data);
    }

  return (
    <div className="relative">
      <div className="opacity-80 absolute bottom-10 left-12 w-200 h-60 bg-black border border-white ">
        <div className="opacity-100 grid grid-rows-[65px_50px_60px_60px] place-items-center">
          <h1 className={`text-[27px]`}>
            Please Enter a New Row for {tableName}
          </h1>
          <h1 className={`text-[20px]`}> Enter Each Field: </h1>
          <div className="flex gap-2">
            {[...Array(numOfFields)].map((_, index) => ( // Dynamically creates lables based on the number passed in
              <input key={index} onChange={(e) => handleChange(index, e.target.value)} className="h-8 w-30 bg-black border border-white" />
            ))}
          </div>
          <div>
            <button onClick={onCancel} className="mr-2.5 row-start-4 h-8 w-50 border border-white bg-black text-white transition-opacity duration-200 hover:bg-red-500">Cancel</button> 
            <button onClick={handleOk} className="ml-2.5 h-8 w-50 border border-white text-white transition-opacity duration-200 hover:bg-green-500">Submit</button>
          </div>
        </div>
      </div>
    </div>
  );
}



