const FormContainer = ({ title, children, onSubmit }) => {
  return (
    <div className="flex justify-center items-center py-8">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          {title}
        </h2>
        <form onSubmit={onSubmit} className="space-y-6">
          {children}
        </form>
      </div>
    </div>
  );
};

export default FormContainer;
