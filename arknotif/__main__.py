import argparse
import logging, logging.handlers
from .app import app


def main():
    args = process_args()
    setup_logging(args)

    app.run(host=args.host, port=args.port, threaded=True)


def process_args():
    parser = argparse.ArgumentParser(
        description="Run a dev webserver for hifive"
    )

    parser.add_argument("-b", "--host",
        default="localhost",
        help="Host to bind the internal webserver to"
    )

    parser.add_argument("-p", "--port",
        default=8080,
        help="Port to bind the internal webserver to"
    )

    parser.add_argument("-v", "--verbosity",
        default="INFO",
        choices=["CRITICAL", "ERROR", "WARNING", "INFO", "DEBUG"],
        help="Log level"
    )

    return parser.parse_args()

def setup_logging(args):
    stream_handler = logging.StreamHandler()
    #file_handler = logging.handlers.RotatingFileHandler(
    #    "REPLACEME.log",
    #    maxBytes=100*1000*1000, # 100MB
    #    backupCount=5 # 5*100MB = 500MB
    #)
    logging.basicConfig(
        level=args.verbosity,
        format="%(asctime)s %(levelname)s:%(name)s:%(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        handlers=[
            #file_handler,
            stream_handler
        ]
    )


if __name__ == "__main__":
    main()

