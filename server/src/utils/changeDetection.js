export const areValuesEqual = (currentValue, newValue) => {
  if (currentValue instanceof Date || newValue instanceof Date) {
    const currentTime = currentValue ? new Date(currentValue).getTime() : null;

    const newTime = newValue ? new Date(newValue).getTime() : null;

    return currentTime === newTime;
  }

  return String(currentValue ?? "") === String(newValue ?? "");
};

export const areArraysEqual = (firstArray = [], secondArray = []) => {
  return JSON.stringify(firstArray) === JSON.stringify(secondArray);
};
