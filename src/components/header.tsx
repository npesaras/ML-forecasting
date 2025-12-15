import { forwardRef } from "react";

const Header = forwardRef<HTMLDivElement>((_props, ref) => {
  return (
    <div
      ref={ref}
      className="flex justify-center items-center flex-1"
    >
      <h1 className="text-xl md:text-2xl font-bold text-foreground">
        Filipino Emigration Dashboard
      </h1>
    </div>
  );
});

Header.displayName = "Header";

export default Header;
