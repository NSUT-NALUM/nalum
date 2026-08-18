import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getUserIdString = (idOrObj: any): string => {
  if (!idOrObj) return "";
  if (typeof idOrObj === "string") return idOrObj;
  if (typeof idOrObj === "object") {
    if (idOrObj._id) return String(idOrObj._id);
    if (idOrObj.id) return String(idOrObj.id);
    return String(idOrObj);
  }
  return "";
};

export const checkIsOwner = (currentUserId: any, resourceUserId: any): boolean => {
  const currentStr = getUserIdString(currentUserId);
  const resourceStr = getUserIdString(resourceUserId);
  if (!currentStr || !resourceStr) return false;
  return currentStr === resourceStr;
};