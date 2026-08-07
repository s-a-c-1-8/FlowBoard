export const mongooseJSONTransform = (document, returnedObject) => {
  returnedObject.id = returnedObject._id?.toString();

  delete returnedObject._id;
  delete returnedObject.__v;

  return returnedObject;
};
