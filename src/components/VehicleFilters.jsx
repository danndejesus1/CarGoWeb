import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Search, Filter } from 'lucide-react';

// Memoized input component that won't re-render unless its specific props change
const StableInput = memo(({ label, value, onChange, placeholder, type = "text", options = [] }) => {
  // This component won't re-render unless its specific props change
  const handleChange = useCallback((e) => {
    onChange(e.target.value);
  }, [onChange]);

  if (type === "select") {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <select 
          value={value}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        {type === "search" && (
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        )}
        <input
          type={type}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={`w-full ${type === "search" ? "pl-10" : "pl-4"} pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
        />
      </div>
    </div>
  );
});

// Parent component
const VehicleFilters = ({ vehicles, onFilteredVehiclesChange }) => {
  // State stored at parent level
  const [inputValues, setInputValues] = useState({
    make: '',
    type: '',
    gasType: '',
    seatingCapacity: '',
    available: 'true',
    pickupDate: '',
    returnDate: '',
    searchText: ''
  });
  
  const vehiclesRef = useRef(vehicles);
  
  // Update vehicles ref when vehicles change
  useEffect(() => {
    vehiclesRef.current = vehicles;
  }, [vehicles]);

  // Input change handlers that don't cause UI refreshes
  const handleMakeChange = useCallback((value) => {
    setInputValues(prev => ({ ...prev, make: value }));
  }, []);

  const handleTypeChange = useCallback((value) => {
    setInputValues(prev => ({ ...prev, type: value }));
  }, []);

  const handleGasTypeChange = useCallback((value) => {
    setInputValues(prev => ({ ...prev, gasType: value }));
  }, []);

  const handleSeatingCapacityChange = useCallback((value) => {
    setInputValues(prev => ({ ...prev, seatingCapacity: value }));
  }, []);

  const handleAvailabilityChange = useCallback((value) => {
    setInputValues(prev => ({ ...prev, available: value }));
  }, []);

  const handleSearchChange = useCallback((value) => {
    setInputValues(prev => ({ ...prev, searchText: value }));
  }, []);
  
  // Apply all filters - only called when button is clicked
  const applyAllFilters = useCallback(() => {
    // Guard against vehicles not being available
    if (!vehiclesRef.current || !Array.isArray(vehiclesRef.current)) {
      onFilteredVehiclesChange([]);
      return;
    }
    
    try {
      // Create a copy of the vehicles array
      let filtered = [...vehiclesRef.current];
      
      // Apply search filter
      if (inputValues.searchText) {
        const searchLower = inputValues.searchText.toLowerCase();
        filtered = filtered.filter(v => 
          (v?.make?.toLowerCase()?.includes(searchLower)) ||
          (v?.model?.toLowerCase()?.includes(searchLower))
        );
      }
      
      // Apply dropdown filters
      if (inputValues.make) {
        filtered = filtered.filter(v => v.make === inputValues.make);
      }
      
      if (inputValues.type) {
        filtered = filtered.filter(v => v.type === inputValues.type);
      }
      
      if (inputValues.gasType) {
        filtered = filtered.filter(v => v.gasType === inputValues.gasType);
      }
      
      if (inputValues.seatingCapacity) {
        filtered = filtered.filter(v => v.seatingCapacity === parseInt(inputValues.seatingCapacity));
      }
      
      if (inputValues.available !== '') {
        const isAvailable = inputValues.available === 'true';
        filtered = filtered.filter(v => v.available === isAvailable);
      }
      
      // Update parent component
      onFilteredVehiclesChange(filtered);
    } catch (error) {
      console.error("Error filtering vehicles:", error);
      onFilteredVehiclesChange([]);
    }
  }, [inputValues, onFilteredVehiclesChange]);
  
  // Clear all filters
  const clearFilters = useCallback(() => {
    const defaultFilters = {
      make: '',
      type: '',
      gasType: '',
      seatingCapacity: '',
      available: 'true',
      pickupDate: '',
      returnDate: '',
      searchText: ''
    };
    
    setInputValues(defaultFilters);
    
    // Apply default filters
    if (vehiclesRef.current) {
      onFilteredVehiclesChange(vehiclesRef.current);
    }
  }, [onFilteredVehiclesChange]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-700 flex items-center">
          <Search className="mr-2" size={20} />
          Filter Vehicles
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={clearFilters}
            className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
            type="button"
          >
            Clear All
          </button>
          <button
            onClick={applyAllFilters}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
            type="button"
          >
            <Filter className="mr-1" size={14} />
            Apply
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Search Input - Memoized */}
        <div className="md:col-span-3">
          <StableInput 
            label="Search Vehicles"
            value={inputValues.searchText}
            onChange={handleSearchChange}
            placeholder="Search by make or model..."
            type="search"
          />
        </div>

        {/* Filter Options - Memoized */}
        <StableInput 
          label="Make"
          value={inputValues.make}
          onChange={handleMakeChange}
          type="select"
          options={[
            { value: "", label: "All Makes" },
            { value: "Toyota", label: "Toyota" },
            { value: "Honda", label: "Honda" }
          ]}
        />

        <StableInput 
          label="Car Type"
          value={inputValues.type}
          onChange={handleTypeChange}
          type="select"
          options={[
            { value: "", label: "All Types" },
            { value: "Sedan", label: "Sedan" },
            { value: "SUV", label: "SUV" }
          ]}
        />

        <StableInput 
          label="Gas Type"
          value={inputValues.gasType}
          onChange={handleGasTypeChange}
          type="select"
          options={[
            { value: "", label: "All Gas Types" },
            { value: "Petrol", label: "Petrol" },
            { value: "Diesel", label: "Diesel" }
          ]}
        />

        <StableInput 
          label="Seating Capacity"
          value={inputValues.seatingCapacity}
          onChange={handleSeatingCapacityChange}
          type="select"
          options={[
            { value: "", label: "Any Capacity" },
            { value: "4", label: "4" },
            { value: "5", label: "5" },
            { value: "7", label: "7" }
          ]}
        />

        <StableInput 
          label="Availability"
          value={inputValues.available}
          onChange={handleAvailabilityChange}
          type="select"
          options={[
            { value: "", label: "All Vehicles" },
            { value: "true", label: "Available Only" },
            { value: "false", label: "Unavailable Only" }
          ]}
        />
      </div>

      {/* Filter Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {inputValues.searchText && (
          <span className="inline-flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded">
            Search: "{inputValues.searchText}"
            <button 
              onClick={() => handleSearchChange('')}
              className="ml-1 text-blue-500 hover:text-blue-700"
            >
              ×
            </button>
          </span>
        )}
        {inputValues.make && (
          <span className="inline-flex items-center bg-gray-100 text-gray-800 px-2 py-1 rounded">
            Make: {inputValues.make}
            <button 
              onClick={() => handleMakeChange('')}
              className="ml-1 text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </span>
        )}
        {inputValues.type && (
          <span className="inline-flex items-center bg-gray-100 text-gray-800 px-2 py-1 rounded">
            Type: {inputValues.type}
            <button 
              onClick={() => handleTypeChange('')}
              className="ml-1 text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </span>
        )}
        {inputValues.gasType && (
          <span className="inline-flex items-center bg-gray-100 text-gray-800 px-2 py-1 rounded">
            Gas: {inputValues.gasType}
            <button 
              onClick={() => handleGasTypeChange('')}
              className="ml-1 text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </span>
        )}
        {inputValues.seatingCapacity && (
          <span className="inline-flex items-center bg-gray-100 text-gray-800 px-2 py-1 rounded">
            Seats: {inputValues.seatingCapacity}
            <button 
              onClick={() => handleSeatingCapacityChange('')}
              className="ml-1 text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </span>
        )}
      </div>
    </div>
  );
};

export default VehicleFilters;
