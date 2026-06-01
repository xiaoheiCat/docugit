# Updated automatically by the Release workflow after each main-branch release.
# Install: brew tap xiaoheiCat/docugit https://github.com/xiaoheiCat/docugit && brew install docugit

class Docugit < Formula
  desc "Git-based version control for Office OpenXML documents"
  homepage "https://github.com/xiaoheiCat/docugit"
  version "2026.06.01_08.43.26_52ac23"
  license "GPL-3.0"

  on_macos do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_08.43.26_52ac23/docugit-darwin-arm64"
      sha256 "26cf465c549ccb44f8ba7987a9b98c1e1c26efd10ad9ebc218316aedd838f10e"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_08.43.26_52ac23/docugit-darwin-amd64"
      sha256 "90b0ad3e60e6a82a9eb3be69a93f86e701670f8e82ce18cd95f0feac1e9f4b65"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_08.43.26_52ac23/docugit-linux-arm64"
      sha256 "7f954cfbe16600197e07d490b41d5ce9650254db4e8ee236367e95d3654dd14f"
    end
    on_intel do
      url "https://github.com/xiaoheiCat/docugit/releases/download/v2026.06.01_08.43.26_52ac23/docugit-linux-amd64"
      sha256 "6b1a303383ee98947a3cc5c77fc66edbeb8f23d8f0ab9db17774f312e5005765"
    end
  end

  def install
    if OS.mac?
      binary = Hardware::CPU.arm? ? "docugit-darwin-arm64" : "docugit-darwin-amd64"
    else
      binary = Hardware::CPU.arm? ? "docugit-linux-arm64" : "docugit-linux-amd64"
    end
    bin.install binary => "docugit"
  end

  test do
    system "#{bin}/docugit", "--version"
  end
end
