import Link from "next/link";

const Page = () => {
  return (
    <div className="flex items-center justify-center h-screen ">
      <Link
        href="/d"
        className="bg-primary text-light px-6 py-3 rounded-xl shadow-lg hover:bg-accent transition-all duration-200 font-semibold"
      >
        Click hapa nani 
      </Link>
    </div>
  );
};

export default Page;
