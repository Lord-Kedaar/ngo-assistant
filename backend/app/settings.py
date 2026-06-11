from pydantic_settings import BaseSettings, SettingsConfigDict
class Settings(BaseSettings):
    model_config=SettingsConfigDict(env_file='.env',extra='ignore')
    omlx_base_url:str='http://127.0.0.1:18585/v1'; omlx_api_key:str=''; omlx_model:str='gemma-4-12B-it-nvfp4'
    cookie_secret:str='change-me'; hmac_secret:str='change-me'; session_quota_per_24h:int=5; global_daily_limit:int=50; store_query_content:bool=False
    question_min_chars:int=3; question_max_chars:int=400; request_timeout_seconds:int=75; retrieval_top_k:int=4; retrieval_min_score:float=0.08
    quota_db_path:str='data/quota/quota.sqlite3'
settings=Settings()
