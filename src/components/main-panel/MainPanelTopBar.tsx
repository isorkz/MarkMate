interface TopBarProps {
  title: string;
};

const MainPanelTopBar = ({ title }: TopBarProps) => {
  return (
    <div className="flex w-full h-10 bg-gray-50 items-center px-4 border-b border-gray-200/80 select-none">
      <div className="text-gray-500 text-sm font-medium">{title}</div>
    </div>
  )
}

export default MainPanelTopBar