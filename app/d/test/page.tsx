'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';

interface Car {
  _id: string;
  registrationNumber: string;
  model: string;
}

const Page = () => {
  const [searchResults, setSearchResults] = useState<Car[]>([]);
  const [selectedCars, setSelectedCars] = useState<Car[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const searchCars = useCallback(
    async (query: string) => {
      if (query.length < 3) {
        setSearchResults([]);
        setShowSearchResults(false);
        return;
      }

      setIsSearching(true);
      try {
        const res = await axios.get(`/api/cars/search?registration=${encodeURIComponent(query)}`);
        const cars = res.data.data || res.data || [];

        // Filter out already selected cars
        const availableCars = cars.filter((car: Car) =>
          !selectedCars.some((selected) => selected._id === car._id)
        );

        setSearchResults(availableCars);
        setShowSearchResults(true);
      } catch (error) {
        console.error('Error searching cars:', error);
        setSearchResults([]);
        setShowSearchResults(false);
      } finally {
        setIsSearching(false);
      }
    },
    [selectedCars]
  );

  return (
    <div className="">
      <form action="">
        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            placeholder="Search by registration number..."
            className="border p-2 rounded w-full"
            onChange={(e) => searchCars(e.target.value)}
          />
          {isSearching && <span>Searching...</span>}
        </div>

        {showSearchResults && searchResults.length > 0 && (
          <ul className="bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((car: Car) => (
              <li
                key={car._id}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  setSelectedCars([...selectedCars, car]);
                  setShowSearchResults(false);
                }}
              >
                {car.registrationNumber} - {car.model}
              </li>
            ))}
          </ul>
        )}

        {/* Render selected cars */}
        <div className="mt-4">
          <h3 className="font-semibold">Selected Cars:</h3>
          <ul className="list-disc pl-5">
            {selectedCars.map((car: Car) => (
              <li key={car._id} className="flex items-center justify-between">
                {car.registrationNumber} - {car.model}
                <button
                  type="button"
                  className="text-red-500 ml-2"
                  onClick={() =>
                    setSelectedCars(selectedCars.filter((c) => c._id !== car._id))
                  }
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      </form>
    </div>
  );
};

export default Page;
