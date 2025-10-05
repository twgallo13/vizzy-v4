import { motion } from 'framer-motion';

export default function DataPage(): JSX.Element {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Data</h1>
        <p className="text-secondary-600 mt-1">Analytics & exports (demo)</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="card"
      >
        <p className="text-sm text-secondary-700">
          This is a simple demo page for analytics and exports. In production, charts and export tools would appear here.
        </p>
      </motion.div>
    </div>
  );
}
