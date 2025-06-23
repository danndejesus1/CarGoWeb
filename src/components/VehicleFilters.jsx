import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Search, Filter } from 'lucide-react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import dayjs from 'dayjs';

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
  
  // Helper: check if a vehicle is available for the selected date range (date-based, ignore time)
  const isVehicleAvailableForDates = useCallback((vehicle, pickupDate, returnDate) => {
    if (vehicle.available === false) return false;
    if (!pickupDate || !returnDate) return true;
    if (!vehicle.bookings || !Array.isArray(vehicle.bookings)) return true;

    // Generate all requested dates
    const reqStart = dayjs(pickupDate);
    const reqEnd = dayjs(returnDate);
    const requestedDates = new Set();
    let d = reqStart;
    while (d.isSameOrBefore(reqEnd, 'day')) {
      requestedDates.add(d.format('YYYY-MM-DD'));
      d = d.add(1, 'day');
    }

    for (const booking of vehicle.bookings) {
      if (booking.status === 'cancelled') continue;
      const bookStart = dayjs(typeof booking.pickupDate === 'string' ? booking.pickupDate.slice(0, 10) : booking.pickupDate);
      const bookEnd = dayjs(typeof booking.returnDate === 'string' ? booking.returnDate.slice(0, 10) : booking.returnDate);
      let bd = bookStart;
      while (bd.isSameOrBefore(bookEnd, 'day')) {
        if (requestedDates.has(bd.format('YYYY-MM-DD'))) {
          return false;
        }
        bd = bd.add(1, 'day');
      }
    }
    return true;
  }, []);

  // Apply all filters - only called when button is clicked
  const applyAllFilters = useCallback(() => {
    console.log('Applying filters with values:', inputValues);
    
    // Guard against vehicles not being available
    if (!vehiclesRef.current || !Array.isArray(vehiclesRef.current)) {
      console.log('No vehicles available to filter');
      onFilteredVehiclesChange([]);
      return;
    }
    
    try {
      // Create a copy of the vehicles array
      let filtered = [...vehiclesRef.current];
      console.log('Starting with', filtered.length, 'vehicles');
      
      // Apply search filter
      if (inputValues.searchText) {
        const searchLower = inputValues.searchText.toLowerCase();
        filtered = filtered.filter(v => 
          (v?.make?.toLowerCase()?.includes(searchLower)) ||
          (v?.model?.toLowerCase()?.includes(searchLower))
        );
        console.log('After search filter:', filtered.length, 'vehicles');
      }
      
      // Apply make filter (case-insensitive, partial match)
      if (inputValues.make) {
        const makeLower = inputValues.make.toLowerCase();
        filtered = filtered.filter(v => v.make && v.make.toLowerCase().includes(makeLower));
        console.log('After make filter:', filtered.length, 'vehicles');
      }
      
      if (inputValues.type) {
        filtered = filtered.filter(v => v.type === inputValues.type);
        console.log('After type filter:', filtered.length, 'vehicles');
      }
      
      if (inputValues.gasType) {
        filtered = filtered.filter(v => v.gasType === inputValues.gasType);
        console.log('After gas type filter:', filtered.length, 'vehicles');
      }
      
      // Apply seating capacity filter (partial match, not strict equality)
      if (inputValues.seatingCapacity) {
        const seatStr = String(inputValues.seatingCapacity).toLowerCase();
        filtered = filtered.filter(v => 
          v.seatingCapacity !== undefined &&
          String(v.seatingCapacity).toLowerCase().includes(seatStr)
        );
        console.log('After seating capacity filter:', filtered.length, 'vehicles');
      }

      // Filter by availability for selected pickup/return dates
      if (inputValues.pickupDate && inputValues.returnDate) {
        console.log('Applying date availability filter...');
        const beforeDateFilter = filtered.length;
        
        filtered = filtered.filter(v => {
          const isAvailable = isVehicleAvailableForDates(
            v,
            inputValues.pickupDate,
            inputValues.returnDate
          );
          console.log(`Vehicle ${v.id} (${v.make} ${v.model}) is ${isAvailable ? 'available' : 'unavailable'}`);
          return isAvailable;
        });
        
        console.log(`Date filter: ${beforeDateFilter} -> ${filtered.length} vehicles`);
      }
      
      // Apply general availability filter
      if (inputValues.available !== '') {
        const isAvailable = inputValues.available === 'true';
        filtered = filtered.filter(v => v.available === isAvailable);
        console.log('After availability filter:', filtered.length, 'vehicles');
      }
      
      console.log('Final filtered count:', filtered.length);
      // Update parent component
      onFilteredVehiclesChange(filtered);
    } catch (error) {
      console.error("Error filtering vehicles:", error);
      onFilteredVehiclesChange([]);
    }
  }, [inputValues, onFilteredVehiclesChange, isVehicleAvailableForDates]);
  
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

  // Helper for date input values
  const parseDate = (str) => (str ? new Date(str) : null);

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

        {/* Pickup Date Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date</label>
          <DatePicker
            selected={parseDate(inputValues.pickupDate)}
            onChange={date => setInputValues(prev => ({
              ...prev,
              pickupDate: date ? date.toISOString().slice(0, 10) : ''
            }))}
            dateFormat="yyyy-MM-dd"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholderText="Select pickup date"
            isClearable
            minDate={new Date()}
          />
        </div>

        {/* Return Date Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
          <DatePicker
            selected={parseDate(inputValues.returnDate)}
            onChange={date => setInputValues(prev => ({
              ...prev,
              returnDate: date ? date.toISOString().slice(0, 10) : ''
            }))}
            dateFormat="yyyy-MM-dd"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholderText="Select return date"
            minDate={inputValues.pickupDate ? parseDate(inputValues.pickupDate) : new Date()}
            isClearable
          />
        </div>

        {/* Make as text input */}
        <StableInput 
          label="Make"
          value={inputValues.make}
          onChange={handleMakeChange}
          type="text"
          placeholder="Enter make..."
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

        {/* Seating Capacity as text input */}
        <StableInput 
          label="Seating Capacity"
          value={inputValues.seatingCapacity}
          onChange={handleSeatingCapacityChange}
          type="text"
          placeholder="Enter capacity..."
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
            Brand: {inputValues.make}
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
        {inputValues.pickupDate && (
          <span className="inline-flex items-center bg-green-100 text-green-800 px-2 py-1 rounded">
            Pickup: {inputValues.pickupDate}
            <button 
              onClick={() => setInputValues(prev => ({ ...prev, pickupDate: '' }))}
              className="ml-1 text-green-500 hover:text-green-700"
            >
              ×
            </button>
          </span>
        )}
        {inputValues.returnDate && (
          <span className="inline-flex items-center bg-green-100 text-green-800 px-2 py-1 rounded">
            Return: {inputValues.returnDate}
            <button 
              onClick={() => setInputValues(prev => ({ ...prev, returnDate: '' }))}
              className="ml-1 text-green-500 hover:text-green-700"
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