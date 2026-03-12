import { InputBar } from "@/components/creation/input-bar";

export function BottomBar() {
  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 h-36 bottom-bar-gradient" />
      <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4">
        <div className="mx-auto max-w-[680px]">
          <InputBar />
        </div>
      </div>
    </>
  );
}
