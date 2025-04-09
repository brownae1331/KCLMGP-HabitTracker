// Type declaration to allow importing .png image files in TypeScript
declare module '*.png' {
    const value: any;
    export default value;
  }