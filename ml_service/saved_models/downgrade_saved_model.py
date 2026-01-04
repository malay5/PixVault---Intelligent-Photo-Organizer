import joblib
import numpy as np
import os
from sklearn.utils import check_random_state

source_model = "D:/startups/pixelvault/ml_service/saved_models/voting_ensemble.pkl"
v1_output_path = "D:/startups/pixelvault/ml_service/saved_models/voting_ensemble_v1.pkl"

print(f"🔄 Running Deep Sanitize on NumPy: {np.__version__}")

try:
    model = joblib.load(source_model)
    
    def sanitize(obj):
        """Recursively strip NumPy-version-specific random states."""
        # Fix the object itself if it has a random_state
        if hasattr(obj, 'random_state'):
            obj.random_state = 42 # Use an int, not an object
        
        # If it's an ensemble, fix all internal estimators
        if hasattr(obj, 'estimators_'):
            for est in obj.estimators_:
                sanitize(est)
        
        # Some sklearn models store a hidden _random_state object
        if hasattr(obj, '_random_state'):
            obj._random_state = None 

    print("🛠️ Performing Deep Sanitization...")
    sanitize(model)

    # CRITICAL: Use pickle protocol 4 and compress=3 to force a clean write
    print("💾 Saving v1 model...")
    joblib.dump(model, v1_output_path, protocol=4, compress=3)
    
    print(f"✅ Deep Fix Complete: {v1_output_path}")

except Exception as e:
    print(f"❌ Error: {e}")